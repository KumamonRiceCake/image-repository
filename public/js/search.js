// Image URL endpoints
const logoutAllUrl = '/users/logoutAll';
const fileListUrl = '/image/list?directory=';
const getImageLinkUrl = '/image/link?';
const deleteImageUrl = '/image?';
const tagSearchUrl = '/image/me?tag=';

// Elements
const $fileList = document.querySelector('#file-list');

// Templates
const fileListTemplate = document.querySelector('#file-list-template').innerHTML;
const imageDetailTemplate = document.querySelector('#image-detail-template').innerHTML;

// Change all occurence of character '/' with '%', and vice versa
const encode = (str) => { return str.replace(/\//g, '%'); };
const decode = (str) => { return str.replace(/%/g, '/'); };

// Parsing currently viewing directory from query string
const { tag } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Sign out user button on click event listener
document.querySelector('#sign_out').addEventListener('click', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', logoutAllUrl);

    xhr.onreadystatechange = function () {
        // redirect to login page if successful
        if (this.readyState === 4 && this.status === 200) {
            location.href = '/';
        }
    };

    xhr.send();
});

// Tag search button on click event listener
document.querySelector('#tag_search_button').addEventListener('click', () => {
    const searchTag = document.querySelector('#search_tag').value;
    if (!searchTag) {
        return alert('Please enter search term');
    }

    // Redirect to tag search result
    location.href = '/dashboard/search?tag=' + searchTag.trim();
});

// Back to dashboard button on click event listener
document.querySelector('#back_to_dashboard_button').addEventListener('click', () => { location.href = '/dashboard'; });

// Enter key event listeners
document.querySelector('#search_tag').addEventListener("keyup", (event) => {
    if (event.keyCode === 13) { document.querySelector("#tag_search_button").click(); }
});

// Display detail of clicked image
const viewDetail = function (directory, filename, url) {
    // render data in Mustache template
    const html = Mustache.render(imageDetailTemplate, {
        directory,
        filename,
        url
    });

    document.querySelector('#detail-box').innerHTML = html;
};

// Download image
const downloadImage = (url) => { window.open(url); };

// Delete image
const deleteImage = (directory, filename) => {
    if (!directory) { directory = ''; }
    
    const xhr = new XMLHttpRequest();
    xhr.open('DELETE', `${deleteImageUrl}directory=${encode(directory)}&filename=${encode(filename)}`);

    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            alert('Image deleted!');
            window.location.reload();   // refresh page
        } else {
            alert('Image deletion failed!');
        }
    };

    xhr.send();
};

// Display files in directory
const getFileList = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', tagSearchUrl + tag);
    
    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            const images = JSON.parse(this.responseText);
            images.forEach((image) => {
                // render data in Mustache template
                const html = Mustache.render(fileListTemplate, {
                    directory: image.directory,
                    filename: image.filename,
                    url: image.url
                })
                $fileList.insertAdjacentHTML('beforeend', html)
            });
        } else {
            alert('Could not read file list!');
        }
    };

    xhr.send();
}

// Function call on page loading
getFileList();