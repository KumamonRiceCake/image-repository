// Image URL endpoints
const logoutAllUrl = '/users/logoutAll';
const imageUploadUrl = '/image';
const fileListUrl = '/image/list?directory=';
const getImageLinkUrl = '/image/link?';
const deleteImageUrl = '/image?';
const deleteFolderUrl = '/image/directory?directory=';
const createFolderUrl = '/image/folders';

// Elements
const $fileList = document.querySelector('#file-list');
const $currentDirectoryLabel = document.querySelector('#current_directory');

// Templates
const fileListTemplate = document.querySelector('#file-list-template').innerHTML;
const imageDetailTemplate = document.querySelector('#image-detail-template').innerHTML;
const folderDetailTemplate = document.querySelector('#folder-detail-template').innerHTML;

// Change all occurence of character '/' to '%'
const encode = (str) => {
    return str.replace(/\//g, '%');
};
const decode = (str) => {
    return str.replace(/%/g, '/');
};

// Parsing currently viewing directory from query string
let { directory } = Qs.parse(location.search, { ignoreQueryPrefix: true });
if (!directory) { directory = ''; }
directory = decode(directory);

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

document.querySelector('#upload_button').addEventListener('click', () => {
    const file = document.querySelector('#file_selector').files[0];

    if (!file) { return alert('Please choose a file!'); }

    const tag = document.querySelector('#upload_tag').value;
    let statusMessage = document.querySelector('#upload_status');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('directory', directory);
    formData.append('tag', tag);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', imageUploadUrl);

    xhr.onloadstart = function () {
        statusMessage.innerHTML = 'Uploading file...';
    };

    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            alert('File uploaded!');
        } else {
            alert('Upload failed!');
        }
        window.location.reload();
    };

    xhr.send(formData);
});

document.querySelector('#create_button').addEventListener('click', () => {
    const folderName = document.querySelector('#new_folder_name').value;

    if (!folderName) {
        return alert('Please provide folder name!');
    }

    const xhr = new XMLHttpRequest();

    xhr.open('POST', createFolderUrl);
    xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 201) {
            alert('Folder Created!');
            window.location.reload();
        } else {
            alert('Folder creation failed!');
        }
    };

    const data = {
        directory,
        folderName
    };

    xhr.send(JSON.stringify(data));
});

document.querySelector('#back_button').addEventListener('click', () => {
    if (directory === '') {
        return alert('There is no more upper directory!');
    }

    const delimiterIndex = directory.substring(0, directory.length-1).lastIndexOf('/');
    if (delimiterIndex === -1) {
        return location.href = '/dashboard?directory=';
    }

    location.href = '/dashboard?directory=' + encode(directory.substring(0, delimiterIndex+1));
});

document.querySelector('#tag_search_button').addEventListener('click', () => {
    const searchTag = document.querySelector('#search_tag').value;
    if (!searchTag) {
        return alert('Please enter search term');
    }

    location.href = '/dashboard/search?tag=' + searchTag.trim();
});

document.querySelector('#search_tag').addEventListener("keyup", (event) => {
    if (event.keyCode === 13) { document.querySelector("#tag_search_button").click(); }
});

document.querySelector('#upload_tag').addEventListener("keyup", (event) => {
    if (event.keyCode === 13) { document.querySelector("#upload_button").click(); }
});

document.querySelector('#new_folder_name').addEventListener("keyup", (event) => {
    if (event.keyCode === 13) { document.querySelector("#create_button").click(); }
});

const viewDetail = function (filename) {
    // Folder
    if (filename.charAt(filename.length-1) === '/') {
        const html = Mustache.render(folderDetailTemplate, {
            filename,
            url: '../img/folder.png'
        });
    
        return document.querySelector('#detail-box').innerHTML = html;
    }

    // Image file
    const endpoint = `${getImageLinkUrl}directory=${encode(directory)}&filename=${filename}`;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', endpoint);

    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            const url = JSON.parse(this.responseText)[0];

            const html = Mustache.render(imageDetailTemplate, {
                filename,
                url
            });
        
            document.querySelector('#detail-box').innerHTML = html;
        } else {
            alert('Image loading failed!');
        }
    };

    xhr.send();
};

const downloadImage = (url) => {
    window.open(url);
};

const deleteImage = (filename) => {
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

const enterDirectory = (folderName) => {
    let { directory } = Qs.parse(location.search, { ignoreQueryPrefix: true });
    if (!directory) {
        return location.href = '/dashboard?directory=' + encode(folderName);
    }

    location.href = window.location.href + encode(folderName);
};

const deleteFolder = (folderName) => {
    const xhr = new XMLHttpRequest();
    xhr.open('DELETE', deleteFolderUrl + encode(directory) + encode(folderName));

    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            alert('Folder deleted!');
            window.location.reload();
        } else {
            alert('Folder deletion failed!');
        }
    };

    const data = { directory };

    xhr.send(JSON.stringify(data));
};

const getFileList = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', fileListUrl + encode(directory));
    
    xhr.onload = function () {
        if (this.readyState === 4 && this.status === 200) {
            const files = JSON.parse(this.responseText);
            files.forEach((filename) => {
                if (filename) {
                    const html = Mustache.render(fileListTemplate, {
                        filename
                    })
                    $fileList.insertAdjacentHTML('beforeend', html)
                }
            });
        } else {
            alert('Could not read file list!');
        }
    };

    xhr.send();
}

const displayCurrentDirectory = () => {
    if (directory === '') {
        return $currentDirectoryLabel.innerText = '/';
    }
    $currentDirectoryLabel.innerText = '/' + directory;
}

displayCurrentDirectory();
getFileList();