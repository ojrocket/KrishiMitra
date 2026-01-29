// Disease detection functionality
let uploadedImageData = null;

function analyzeImage() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Please select an image first', 'error');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please upload a valid image file', 'error');
        return;
    }

    // Show loading state
    showAnalysisLoading();

    // Create FileReader to read the image
    const reader = new FileReader();
    reader.onload = function (e) {
        uploadedImageData = e.target.result;
        displayUploadedImage(uploadedImageData);

        // Simulate AI analysis (in real implementation, this would call an AI service)
        setTimeout(() => {
            performDiseaseAnalysis(file.name);
        }, 2000);
    };

    reader.readAsDataURL(file);
}

function showAnalysisLoading() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Analyzing your image...</p>
        </div>
    `;
}

function displayUploadedImage(imageSrc) {
    const resultSection = document.getElementById('analysisResult');
    const uploadedImage = document.getElementById('uploadedImage');

    uploadedImage.src = imageSrc;
    resultSection.style.display = 'grid';
}

function performDiseaseAnalysis(fileName) {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('No file selected', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    fetch('/api/detect-disease', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Analysis failed');
        }
        return response.json();
    })
    .then(result => {
        if (result.error) {
            throw new Error(result.error);
        }
        displayAnalysisResults(result);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Failed to analyze image. Please try again.', 'error');
    })
    .finally(() => {
        resetUploadArea();
    });
}

function displayAnalysisResults(result) {
    // Update disease title
    document.getElementById('diseaseTitle').textContent = result.disease;

    // Update confidence bar
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceText = document.getElementById('confidenceText');

    confidenceBar.style.width = result.confidence + '%';
    confidenceText.textContent = result.confidence + '%';

    // Set confidence bar color based on confidence level
    if (result.confidence >= 80) {
        confidenceBar.style.background = '#4CAF50';
    } else if (result.confidence >= 60) {
        confidenceBar.style.background = '#FF9800';
    } else {
        confidenceBar.style.background = '#f44336';
    }

    // Update treatment recommendations
    const treatmentList = document.getElementById('treatmentList');
    treatmentList.innerHTML = '';

    result.treatments.forEach(treatment => {
        const li = document.createElement('li');
        li.textContent = treatment;
        treatmentList.appendChild(li);
    });

    // Show success notification
    showNotification('Analysis complete!', 'success');
}

function resetUploadArea() {
    setTimeout(() => {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Upload or drag another image of your plant</p>
            <input type="file" id="imageUpload" accept="image/*" onchange="analyzeImage()">
            <button class="upload-btn" onclick="document.getElementById('imageUpload').click()">
                Choose Image
            </button>
        `;
    }, 1000);
}

// Drag and drop functionality
function initializeDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');

    uploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function (e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('imageUpload');
            fileInput.files = files;
            analyzeImage();
        }
    });
}

// Initialize drag and drop when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeDragAndDrop();
});
