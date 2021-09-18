// Change all occurence of character '/' to '%'
const encode = (str) => {
    return str.replace(/\//g, '%');
};

const decode = (str) => {
    return str.replace(/%/g, '/');
};

module.exports = {
    encode,
    decode
};