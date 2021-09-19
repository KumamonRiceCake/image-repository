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

// Change all occurence of character '/' to '%'
const encode = (str) => {
    return str.replace(/\//g, '%');
};
const decode = (str) => {
    return str.replace(/%/g, '/');
};

// Parsing currently viewing directory from query string
const { tag } = Qs.parse(location.search, { ignoreQueryPrefix: true });

document.querySelector('#sign_out').addEventListener('click', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', logoutAllUrl);

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            location.href = '/';
        }
    };

    xhr.send();
});

document.querySelector('#tag_search_button').addEventListener('click', () => {
    const searchTag = document.querySelector('#search_tag').value;
    if (!searchTag) {
        return alert('Please enter search term');
    }

    location.href = '/dashboard/search?tag=' + searchTag.trim();
});

document.querySelector('#back_to_dashboard_button').addEventListener('click', () => {
    location.href = '/dashboard';
});

document.querySelector('#search_tag').addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        document.querySelector("#tag_search_button").click();
    }
});

const viewDetail = function (directory, filename, url) {
    const html = Mustache.render(imageDetailTemplate, {
        directory,
        filename,
        url
    });

    document.querySelector('#detail-box').innerHTML = html;
};

const downloadImage = (url) => {
    window.open(url);
};

const deleteImage = (directory, filename) => {
    if (!directory) { directory = ''; }
    
    const xhr = new XMLHttpRequest();
    xhr.open('DELETE', `${deleteImageUrl}directory=${encode(directory)}&filename=${encode(filename)}`);

    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            alert('Image deleted!');
            window.location.reload();
        } else {
            alert('Image deletion failed!');
        }
    };

    xhr.send();
};

const getFileList = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', tagSearchUrl + tag);
    
    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            const images = JSON.parse(this.responseText);
            images.forEach((image) => {
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

getFileList();