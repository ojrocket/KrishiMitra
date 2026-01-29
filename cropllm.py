import numpy as np
import pandas as pd
import sqlite3
import os
import json

# Try to import dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not found.")

# Try to import AI libraries (CLIP)
try:
    from PIL import Image
    from transformers import CLIPProcessor, CLIPModel
    import torch
    CLIP_AVAILABLE = True
except ImportError:
    CLIP_AVAILABLE = False
    print("Warning: CLIP dependencies not found.")

# Try to import Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not found.")

# Load CLIP model (if available)
model = None
processor = None
if CLIP_AVAILABLE:
    try:
        print("Loading CLIP model...")
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        print("CLIP model loaded.")
    except Exception as e:
        print(f"Failed to load CLIP: {e}")
        CLIP_AVAILABLE = False


# Common crop diseases for zero-shot classification (Fallback)
DISEASE_LABELS = [
    "healthy plant",
    "apple scab",
    "apple black rot",
    "grape black rot",
    "grape esca",
    "corn northern leaf blight",
    "corn common rust",
    "tomato late blight",
    "tomato early blight",
    "tomato bacterial spot",
    "potato late blight",
    "potato early blight",
    "pepper bacterial spot",
    "rice bacterial leaf blight",
    "rice brown spot"
]

TREATMENTS = {
    "healthy plant": [
        "Continue current care practices",
        "Monitor regularly for any changes"
    ],
    "tomato late blight": [
        "Remove affected leaves immediately",
        "Apply copper-based fungicide",
        "Improve air circulation"
    ],
    # ... (Keep existing treatments or expand)
    "default": [
        "Isolate affected plant",
        "Consult local agricultural extension",
        "Ensure proper watering and nutrition"
    ]
}

def detect_disease_gemini(image_path, api_key):
    """
    Uses Google Gemini 1.5 Flash for disease detection.
    """
    print("Using Gemini for detection...")
    genai.configure(api_key=api_key)
    
    generation_config = {
        "temperature": 0.4,
        "top_p": 1,
        "top_k": 32,
        "max_output_tokens": 1024,
        "response_mime_type": "application/json",
    }

    model_gemini = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config,
    )

    try:
        image = Image.open(image_path)
        prompt = """
        Analyze this plant image for diseases.
        Return a JSON object with this exact structure:
        {
            "disease": "Name of the disease or 'Healthy'",
            "confidence": 95,
            "treatments": ["Step 1", "Step 2", "Step 3"]
        }
        If it's not a plant, set disease to "Not a plant".
        """
        
        response = model_gemini.generate_content([prompt, image])
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Error: {e}")
        return None

def detect_disease_clip_local(image_path):
    """
    Uses CLIP zero-shot classification (Local Fallback).
    """
    if not CLIP_AVAILABLE:
        return None

    try:
        image = Image.open(image_path)
        text_inputs = [f"a photo of a plant with {label}" for label in DISEASE_LABELS]
        
        inputs = processor(
            text=text_inputs, 
            images=image, 
            return_tensors="pt", 
            padding=True
        )

        with torch.no_grad():
            outputs = model(**inputs)
            probs = outputs.logits_per_image.softmax(dim=1)

        probs_np = probs.numpy()[0]
        predicted_idx = np.argmax(probs_np)
        confidence = probs_np[predicted_idx] * 100
        predicted_label = DISEASE_LABELS[predicted_idx]

        treatments = TREATMENTS.get(predicted_label, TREATMENTS.get("default", ["Consult expert"]))

        return {
            "disease": predicted_label.title(),
            "confidence": round(float(confidence), 2),
            "treatments": treatments
        }
    except Exception as e:
        print(f"CLIP Error: {e}")
        return None

def detect_disease(image_path):
    """
    Main detection function.
    Priority:
    1. Gemini API (if key exists and installed)
    2. CLIP Local (if installed)
    3. Mock/Error
    """
    # 1. Try Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if GEMINI_AVAILABLE and api_key:
        result = detect_disease_gemini(image_path, api_key)
        if result:
            return result

    # 2. Try CLIP
    if CLIP_AVAILABLE:
        print("Falling back to CLIP...")
        result = detect_disease_clip_local(image_path)
        if result:
            return result
            
    # 3. Fallback
    return {
        "disease": "System Logic Error",
        "confidence": 0,
        "treatments": [
            "Could not run AI models.",
            "Please ensure 'google-generativeai' is installed AND/OR 'transformers' is installed.",
            "Check .env file for GEMINI_API_KEY."
        ]
    }


# Try to load Local LLM (Flan-T5) if transformers is available
local_llm = None
local_tokenizer = None
if CLIP_AVAILABLE:
    try:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        print("Loading Local LLM (Flan-T5)...")
        # flan-t5-small is lightweight (~300MB)
        local_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")
        local_llm = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-small")
        print("Local LLM loaded successfully.")
    except Exception as e:
        print(f"Failed to load Local LLM: {e}")

# ... (Existing detections functions) ...

def get_chat_response_local(query):
    """
    Uses local Flan-T5 model to answer questions.
    """
    if not local_llm or not local_tokenizer:
        return None
        
    try:
        # Prompt engineering for Flan-T5
        # It handles "instructions" well.
        prompt = f"Answer this question about farming: {query}"
        
        inputs = local_tokenizer(prompt, return_tensors="pt")
        outputs = local_llm.generate(**inputs, max_length=150, do_sample=True, temperature=0.7)
        response = local_tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response
    except Exception as e:
        print(f"Local LLM Error: {e}")
        return None

def get_chat_response_simple(query):
    api_key = os.getenv("GEMINI_API_KEY")
    query_lower = query.lower()

    # 1. Try Gemini (Best Quality)
    if GEMINI_AVAILABLE and api_key:
        try:
            genai.configure(api_key=api_key)
            model_chat = genai.GenerativeModel("gemini-1.5-flash")
            
            # Strict System Prompt
            system_prompt = """
            You are KrishiMitra, an AI assistant dedicated EXCLUSIVELY to agriculture.
            
            YOUR MANDATE:
            1. ANSWER only questions about:
               - Farming techniques, crop management, soil health.
               - Plant diseases, pests, and their organic/chemical cures.
               - Weather impacts on agriculture.
               - Tools and machinery for farming.
            
            2. REFUSE immediately and politely if the user asks about:
               - Politics, entertainment, movies, sports.
               - General knowledge, history, math, coding (unless related to agri-tech).
               - Personal advice, medical advice (for humans).
            
            3. REFUSAL FORMAT:
               "I am KrishiMitra, an intelligent farming assistant. I can only answer questions related to agriculture, crops, and plant diseases. Please ask me something about farming."
            
            User Query: {query}
            """
            
            response = model_chat.generate_content(system_prompt.format(query=query))
            return response.text
        except Exception as e:
             print(f"Gemini Chat Error: {e}")
             pass

    # 2. Try Local LLM (Good Quality, Offline)
    print("Falling back to Local LLM...")
    local_response = get_chat_response_local(query)
    if local_response:
        return local_response

    # 3. Simple fallback (Rule-based)
    if "disease" in query_lower:
        return "I can help identify diseases using the 'Disease Detection' feature. Please upload a photo there."
    elif "farm" in query_lower or "crop" in query_lower or "plant" in query_lower:
        return "I am here to help with farming. Please ask specifically about your crops, like 'How to grow tomatoes'."
    
    return "I am KrishiMitra, your farming assistant. I can help with agriculture and plant diseases. Please ask me a question!"