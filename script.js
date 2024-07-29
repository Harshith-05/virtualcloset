document.addEventListener('DOMContentLoaded', loadPage);

const categories = ['Kanjivaram Silk', 'Banarasi', 'Chikankari', 'Bandhani', 'Nauvari', 'Tant', 'Bomkai', 'Chanderi', 'Kasavu', 'Muga', 'Phulkari'];
const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Orange', 'Brown', 'Grey'];
let currentStream;
let currentFacingMode = 'environment'; // Default to rear camera
let editIndex = -1;

function loadPage() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showUploadSection();
        loadImages();
    } else {
        showAuthSection();
    }
}

function showAuthSection() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('upload-section').style.display = 'none';
}

function showUploadSection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('upload-section').style.display = 'block';
}

function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    if (username && password) {
        let users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username]) {
            alert('Username already exists.');
        } else {
            users[username] = { password, images: [] };
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', username);
            alert('Registration successful!');
            showUploadSection();
        }
    } else {
        alert('Please enter both username and password.');
    }
}

function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (username && password) {
        let users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[username] && users[username].password === password) {
            localStorage.setItem('currentUser', username);
            alert('Login successful!');
            showUploadSection();
            loadImages();
        } else {
            alert('Invalid username or password.');
        }
    } else {
        alert('Please enter both username and password.');
    }
}

function handleFileSelection(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const imageElement = document.createElement('img');
        imageElement.src = event.target.result;
        imageElement.id = 'preview-image';
        
        const previewContainer = document.createElement('div');
        previewContainer.id = 'preview-container';
        
        previewContainer.appendChild(imageElement);
        
        const existingPreview = document.getElementById('preview-container');
        if (existingPreview) {
            existingPreview.replaceWith(previewContainer);
        } else {
            document.body.insertBefore(previewContainer, document.getElementById('closet'));
        }

        document.getElementById('details-inputs').style.display = 'block';
        suggestCategory();
    };
    
    reader.readAsDataURL(file);
}

function startCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode }
    }).then(stream => {
        currentStream = stream;
        document.getElementById('camera').srcObject = stream;
        document.getElementById('camera').style.display = 'block';
        document.getElementById('capture-button').style.display = 'block';
        document.getElementById('switch-button').style.display = 'block';
    }).catch(err => {
        alert('Error accessing camera: ' + err.message);
    });
}

function switchCamera() {
    currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
    startCamera();
}

function captureImage() {
    const video = document.getElementById('camera');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageElement = document.createElement('img');
    imageElement.src = canvas.toDataURL('image/png');
    imageElement.id = 'preview-image';
    
    const previewContainer = document.createElement('div');
    previewContainer.id = 'preview-container';
    
    previewContainer.appendChild(imageElement);
    
    const existingPreview = document.getElementById('preview-container');
    if (existingPreview) {
        existingPreview.replaceWith(previewContainer);
    } else {
        document.body.insertBefore(previewContainer, document.getElementById('closet'));
    }

    document.getElementById('camera').style.display = 'none';
    document.getElementById('capture-button').style.display = 'none';
    document.getElementById('switch-button').style.display = 'none';
    document.getElementById('details-inputs').style.display = 'block';
    suggestCategory();
}

function suggestCategory() {
    const currentUser = localStorage.getItem('currentUser');
    let users = JSON.parse(localStorage.getItem('users')) || {};
    let userCategories = users[currentUser]?.images.map(image => image.category) || [];
    let userColors = users[currentUser]?.images.map(image => image.color) || [];

    let suggestedCategory = categories.find(category => !userCategories.includes(category));
    let suggestedColor = colors.find(color => !userColors.includes(color));

    if (suggestedCategory || suggestedColor) {
        document.getElementById('suggestion-category').textContent = suggestedCategory || 'All categories covered';
        document.getElementById('suggestion-color').textContent = suggestedColor || 'All colors covered';
        document.getElementById('suggested-details').style.display = 'block';
    } else {
        document.getElementById('suggested-details').style.display = 'none';
    }
}

function uploadImage() {
    const imageElement = document.getElementById('preview-image');
    const category = document.getElementById('clothing-category').value;
    const color = document.getElementById('clothing-color').value;

    const itemContainer = document.createElement('div');
    itemContainer.className = 'item-container';

    const categoryElement = document.createElement('p');
    categoryElement.textContent = `Category: ${category}`;
    categoryElement.classList.add('editable-category');
    categoryElement.setAttribute('data-index', -1);

    const colorElement = document.createElement('p');
    colorElement.textContent = `Color: ${color}`;
    colorElement.classList.add('editable-color');
    colorElement.setAttribute('data-index', -1);

    itemContainer.appendChild(imageElement.cloneNode(true));
    itemContainer.appendChild(categoryElement);
    itemContainer.appendChild(colorElement);

    document.getElementById('closet').appendChild(itemContainer);

    saveImage(imageElement.src, category, color);

    // Clear the inputs and preview
    document.getElementById('file-input').value = '';
    document.getElementById('clothing-category').value = '';
    document.getElementById('clothing-color').value = '';
    
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
        previewContainer.remove();
    }

    document.getElementById('details-inputs').style.display = 'none';
    document.getElementById('suggested-details').style.display = 'none';
}


function saveImage(imageData, category, color) {
    const currentUser = localStorage.getItem('currentUser');
    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[currentUser]) {
        users[currentUser].images.push({ imageData, category, color });
        localStorage.setItem('users', JSON.stringify(users));
    }
    loadImages();
}

function loadImages() {
    const currentUser = localStorage.getItem('currentUser');
    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[currentUser]) {
        document.getElementById('closet').innerHTML = ''; // Clear existing items
        users[currentUser].images.forEach((image, index) => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'item-container';

            const imageElement = document.createElement('img');
            imageElement.src = image.imageData;

            const categoryElement = document.createElement('p');
            categoryElement.textContent = `Category: ${image.category}`;
            categoryElement.classList.add('editable-category');
            categoryElement.setAttribute('data-index', index);

            const colorElement = document.createElement('p');
            colorElement.textContent = `Color: ${image.color}`;
            colorElement.classList.add('editable-color');
            colorElement.setAttribute('data-index', index);

            itemContainer.appendChild(imageElement);
            itemContainer.appendChild(categoryElement);
            itemContainer.appendChild(colorElement);

            document.getElementById('closet').appendChild(itemContainer);
        });
        addEditableListeners();
    }
}

function addEditableListeners() {
    document.querySelectorAll('.editable-category').forEach(element => {
        element.addEventListener('click', () => {
            editIndex = element.getAttribute('data-index');
            const currentUser = localStorage.getItem('currentUser');
            let users = JSON.parse(localStorage.getItem('users')) || {};
            if (users[currentUser]) {
                const image = users[currentUser].images[editIndex];
                const select = document.createElement('select');

                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    if (category === image.category) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });

                element.replaceWith(select);
                select.focus();
                select.addEventListener('blur', () => {
                    users[currentUser].images[editIndex].category = select.value;
                    localStorage.setItem('users', JSON.stringify(users));
                    loadImages();
                });
            }
        });
    });

    document.querySelectorAll('.editable-color').forEach(element => {
        element.addEventListener('click', () => {
            editIndex = element.getAttribute('data-index');
            const currentUser = localStorage.getItem('currentUser');
            let users = JSON.parse(localStorage.getItem('users')) || {};
            if (users[currentUser]) {
                const image = users[currentUser].images[editIndex];
                const select = document.createElement('select');

                colors.forEach(color => {
                    const option = document.createElement('option');
                    option.value = color;
                    option.textContent = color;
                    if (color === image.color) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });

                element.replaceWith(select);
                select.focus();
                select.addEventListener('blur', () => {
                    users[currentUser].images[editIndex].color = select.value;
                    localStorage.setItem('users', JSON.stringify(users));
                    loadImages();
                });
            }
        });
    });
}





