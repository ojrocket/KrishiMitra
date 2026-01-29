
try:
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
    print("Import successful.")
    
    print("Loading Tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")
    print("Tokenizer loaded.")
    
    print("Loading Model...")
    model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-small")
    print("Model loaded.")
    
    prompt = "Answer this: What is farming?"
    inputs = tokenizer(prompt, return_tensors="pt")
    outputs = model.generate(**inputs, max_length=50)
    print("Output:", tokenizer.decode(outputs[0], skip_special_tokens=True))
    
except Exception as e:
    print(f"ERROR: {e}")
