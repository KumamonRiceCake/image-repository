const request = require('supertest');
const app = require('../src/app');
const Image = require('../src/models/Image');
const { userOne, setupDatabase } = require('./fixtures/db');
const { emptyDirectory } = require('../src/routers/utils/s3');

beforeEach(async () => {
    await emptyDirectory('');
    await setupDatabase();
    await request(app)
        .post('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('image', 'tests/fixtures/ex1.png')  // This should be from the root of the project
        .field({
            directory: 'test1/test1-1/',
            tag: 'testTag1'
        })
        .expect(200);
    await request(app)
        .post('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('image', 'tests/fixtures/ex2.bmp')
        .field({
            directory: 'test1/test1-1/',
            tag: 'testTag2'
        })
        .expect(200);
    await request(app)
        .post('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: '',
            folderName: 'test2/'
        })
        .expect(201);
});

test('Should upload image file for user', async () => {
    const response = await request(app)
        .post('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('image', 'tests/fixtures/ex3.jpg')
        .field({
            directory: 'test1/test1-1/',
            tag: 'testTag1'
        })
        .expect(200);

    expect(response.body).toMatchObject({
        filename: 'ex3.jpg',
        directory: 'test1/test1-1/',
        tag: 'testTag1'
    });

    const image = await Image.findOne({
        filename: 'ex3.jpg',
        directory: 'test1/test1-1/',
        tag: 'testTag1',
        owner: userOne._id
    });

    expect(image).not.toBeNull();
});

test('Should not upload non-file for user', async () => {
    await request(app)
        .post('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('image', 'tests/fixtures/test_text.txt')
        .field({
            directory: 'test1/test1-1/',
            tag: 'testTag1'
        })
        .expect(400);
});

test('Should not upload without image file', async () => {
    await request(app)
        .post('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .field({
            directory: 'test1/test1-1/',
            tag: 'testTag1'
        })
        .expect(400);
});

test('Should not upload image file without directory field', async () => {
    await request(app)
        .post('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('image', 'tests/fixtures/ex3.jpg')
        .field({
            tag: 'testTag1'
        })
        .expect(400);
});

test('Should not upload duplicate image file', async () => {
    await request(app)
        .post('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('image', 'tests/fixtures/ex1.png')
        .field({
            directory: 'test1/test1-1/',
            tag: 'testTag1'
        })
        .expect(400);
});

test('Should fetch folders in directory', async () => {
    const response = await request(app)
        .get('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/'
        })
        .expect(200);

    expect(response.body.length).toEqual(1);
});

test('Should not fetch folders if directory is not provided', async () => {
    await request(app)
        .get('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(400);
});

test('Should not fetch folders for nonexistent directory', async () => {
    await request(app)
        .get('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'non-exist/'
        })
        .expect(404);
});

test('Should not fetch folders for unauthenticated user', async () => {
    await request(app)
        .get('/image/folders')
        .send({
            directory: 'test1/'
        })
        .expect(401);
});

test('Should create folder for user', async () => {
    await request(app)
        .post('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/',
            folderName: 'test1-2'
        })
        .expect(201);
});

test('Should not create folder if directory is not provided', async () => {
    await request(app)
        .post('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            folderName: 'test1-2'
        })
        .expect(400);
});

test('Should not create folder if folder name is not provided', async () => {
    await request(app)
        .post('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/'
        })
        .expect(400);
});

test('Should not create duplicate folder', async () => {
    await request(app)
        .post('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/',
            folderName: 'test1-2'
        })
        .expect(201);

    await request(app)
        .post('/image/folders')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/',
            folderName: 'test1-2'
        })
        .expect(400);
});

test('Should not create folder for unauthenticated user', async () => {
    await request(app)
        .post('/image/folders')
        .send({
            directory: 'test1/',
            folderName: 'test1-2'
        })
        .expect(401);
});

test('Should delete file for user', async () => {
    const response = await request(app)
        .delete('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/test1-1/',
            filename: 'ex1.png'
        })
        .expect(200);

    expect(response.body).toMatchObject({
        directory: 'test1/test1-1/',
        filename: 'ex1.png'
    });
    
    const image = await Image.findOne({
        directory: 'test1/test1-1/',
        filename: 'ex1.png',
        owner: userOne._id
    });

    expect(image).toBeNull();
});

test('Should delete empty folder for user', async () => {
    const response = await request(app)
        .delete('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: '',
            filename: 'test2/'
        })
        .expect(200);
});

test('Should not delete file if directory is not provided', async () => {
    const response = await request(app)
        .delete('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            filename: 'ex1.png'
        })
        .expect(400);
});

test('Should not delete file if file name is not provided', async () => {
    const response = await request(app)
        .delete('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/test1-1/'
        })
        .expect(400);
});

test('Should not delete non-existent file', async () => {
    await request(app)
        .delete('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/test1-1/',
            filename: 'non-existent.txt'
        })
        .expect(400);
});

test('Should not delete file for unauthenticated user', async () => {
    await request(app)
        .delete('/image')
        .send({
            directory: 'test1/test1-1/',
            filename: 'ex1.png'
        })
        .expect(401);
});

test('Should fetch files in directory for user', async () => {
    const response = await request(app)
        .get('/image/directory')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/test1-1/'
        })
        .expect(200);

    expect(response.body.length).toEqual(2);
});

test('Should not fetch files if directory is not provided', async () => {
    await request(app)
        .get('/image/directory')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(400);
});

test('Should not fetch files in non-existent directory', async () => {
    await request(app)
        .get('/image/directory')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'non-exist/'
        })
        .expect(404);
});

test('Should fetch files in directory for unauthenticated user', async () => {
    const response = await request(app)
        .get('/image/directory')
        .send({
            directory: 'test1/test1-1/'
        })
        .expect(401);
});

test('Should empty directory for user', async () => {
    await request(app)
        .delete('/image/directory')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/'
        })
        .expect(200);

    const images = await Image.find({
        owner: userOne._id
    });

    expect(images.length).toEqual(0);
});

test('Should not empty directory if directory is not provided', async () => {
    await request(app)
        .delete('/image/directory')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(400);
});

test('Should empty non-existent directory', async () => {
    await request(app)
        .delete('/image/directory')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'non-exist/'
        })
        .expect(404);
});

test('Should empty directory for user', async () => {
    await request(app)
        .delete('/image/directory')
        .send({
            directory: 'test1/'
        })
        .expect(401);
});

test('Should get url link of file for user', async () => {
    const response = await request(app)
        .get('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/test1-1/',
            filename: 'ex1.png'
        })
        .expect(200);

    expect(response.body[0]).toEqual(expect.any(String));
});

test('Should not get url link of file if directory is not provided', async () => {
    await request(app)
        .get('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            filename: 'ex1.png'
        })
        .expect(400);
});

test('Should not get url link of file if file name is not provided', async () => {
    await request(app)
        .get('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/test1-1/'
        })
        .expect(400);
});

test('Should not get link of folder', async () => {
    await request(app)
        .get('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/',
            filename: 'test1-1/'
        })
        .expect(404);
});

test('Should not get link of nonexistent file', async () => {
    await request(app)
        .get('/image')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            directory: 'test1/test1-1/',
            filename: 'non-existent.jpg'
        })
        .expect(404);
});

test('Should not get url link of file for unauthenticated user', async () => {
    await request(app)
        .get('/image')
        .send({
            directory: 'test1/test1-1/',
            filename: 'ex1.png'
        })
        .expect(401);
});

test('Should fetch all files of user', async () => {
    const response = await request(app)
        .get('/image/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toEqual(2);
});

test('Should sort files by createdAt', async () => {
    const response = await request(app)
        .get('/image/me?sortBy=createdAt:desc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toEqual(2);
    expect(response.body[0]).toMatchObject({
        directory: 'test1/test1-1/',
        filename: 'ex2.bmp'
    });
});

test('Should sort files by updatedAt', async () => {
    const response = await request(app)
        .get('/image/me?sortBy=updatedAt:desc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toEqual(2);
    expect(response.body[0]).toMatchObject({
        directory: 'test1/test1-1/',
        filename: 'ex2.bmp'
    });
});

test('Should sort files by filename', async () => {
    const response = await request(app)
        .get('/image/me?sortBy=filename:desc')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toEqual(2);
    expect(response.body[0]).toMatchObject({
        directory: 'test1/test1-1/',
        filename: 'ex2.bmp'
    });
});

test('Should fetch page of files (limit 2 and skip 1)', async () => {
    const response = await request(app)
        .get('/image/me?limit=2&skip=1')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toEqual(1);
    expect(response.body[0]).toMatchObject({
        directory: 'test1/test1-1/',
        filename: 'ex2.bmp'
    });
});

test('Should fetch files of specific tag', async () => {
    const response = await request(app)
        .get('/image/me?tag=testTag2')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toEqual(1);
    expect(response.body[0]).toMatchObject({
        directory: 'test1/test1-1/',
        filename: 'ex2.bmp',
        tag: 'testTag2'
    });
});

test('Should fetch files of specific tag sort by createdAt (limit 2 and skip 0)', async () => {
    const response = await request(app)
        .get('/image/me?tag=testTag2&sortBy=createdAt:desc&limit=2&skip=0')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toEqual(1);
    expect(response.body[0]).toMatchObject({
        directory: 'test1/test1-1/',
        filename: 'ex2.bmp',
        tag: 'testTag2'
    });
});

test('Should not fetch files for unauthenticated user', async () => {
    await request(app)
        .get('/image/me')
        .send()
        .expect(401);
});