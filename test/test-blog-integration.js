const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const expect = chai.expect;
const should = chai.should();

const {BlogPost} = require('../models');
const {runServer, app, closeServer} = require('../server');
const {DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function generateBlogPost() {
    return {
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph()
    }
}
function seedBlogData() {
    const seedData = [];
    for(let i = 0; i < 10; i++) {
        seedData.push(generateBlogPost());
    }
    return BlogPost.insertMany(seedData);
}

function tearDownDb() {
    console.warn("Tearing down database");
    return mongoose.connection.dropDatabase();
}

describe('BlogPosts API resource', function() {
    before(function() {
        return runServer(DATABASE_URL);
    });

    beforeEach(function() {
        return seedBlogData(); 
    });

    afterEach(function() {
        return tearDownDb(); 
    });

    after(function() {
        return closeServer();
    });

    describe('GET endpoint', function() {
        it('should return all blog posts', function() {
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function(_res){
                    res = _res;
                    //**************************************** */
                    //res.body is an array of post OBJECTS
                    //**************************************** */


                    // console.log("RES BODY KEYS ARE " + Object.keys(res.body));
                    // console.log("RES BODY POSTS ARRAY LENGTH " + res.body.length);
                    // console.log("RES BODY POST FIRST ITEM IS " + res.body[0].title);
                    res.should.have.status(200);
                    expect(res.body).to.have.length.of.at.least(1);
                    // console.log('RES BODY IS ' + res.body);
                    // console.log('RES BODY POSTS IS ' + res.body.posts);
                    return BlogPost.count();
                })
                .then(function(count) {
                    expect(res.body).to.have.lengthOf(count);
                });
        }); //first it

        it('should return blog posts with correct fields', function() {
            let resPost;
            return chai.request(app)
                .get('/posts')
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.length.of.at.least(1);

                    res.body.forEach(function(post) {
                        expect(post).to.be.a('object');
                        expect(post).to.include.keys(
                            'id', 'author', 'content', 'title', 'created');
                    });
                    resPost = res.body[0];
                    // console.log('resPost author is ' + resPost.author);
                    // console.log('res Body first post author is ' + res.body[0].author);
                    //this looks in Mongo DB to find a certain post ID
                    return BlogPost.findById(resPost.id);
                })
                .then(function(post) {
                    // console.log('Post author is ' + post.authorName);
                    // console.log('resPost author is ' + resPost.author);

                    expect(resPost.author).to.equal(post.authorName);
                    expect(resPost.title).to.equal(post.title);
                    expect(resPost.content).to.equal(post.content);    
                });
        }); //second it
    }); //GET describe

    describe('POST endpoint', function() {
        it('should add new blog post', function() {
            let newPost = generateBlogPost();
            return chai.request(app)
                .post('/posts')
                .send(newPost)
                .then(function(res){
                    // console.log('newPost author is ' + newPost.author.firstName);
                    // console.log('res body author is ' + res.body.author);

                    //this is "created OK" status
                    expect(res).to.have.status(201);
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys(
                        'id','author','title','content','created');
                    expect(res.body.author).to.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
                    expect(res.body.content).to.equal(newPost.content);
                    expect(res.body.title).to.equal(newPost.title);
                    expect(res.body.id).to.not.be.null;
                    
                    return BlogPost.findById(res.body.id);
                })
                .then(function(post){
                    expect(post.author.firstName).to.equal(newPost.author.firstName);
                    expect(post.author.lastName).to.equal(newPost.author.lastName);
                    expect(post.content).to.equal(newPost.content);
                    expect(post.title).to.equal(newPost.title);
                });
        }); //first POST it
    }); //POST describe
    
    describe('PUT endpoint', function(){
        it('should update blog Post', function(){
            const updatePost = {
                title: "blah blah",
                content: "Updating this post for a test"
            };

            return BlogPost
                //find random post
                .findOne() 
                .then(function(post){
                    //make your updatedPost = to the id of one you just found
                    updatePost.id = post.id;

                    return chai.request(app)
                        .put(`/posts/${post.id}`)
                        .send(updatePost);
                })
                .then(function(res){
                    //204 status means successfully reset doc, no content to return
                    expect(res).to.have.status(204);
                    //find ID of post you just updated, return that as promise to next .then
                    // console.log('updatePost is ' + updatePost.title);
                    return BlogPost.findById(updatePost.id);
                })
                .then(function(post){
                    // console.log('updatePost title is ' + updatePost.title);
                    // console.log('post title is ' + post.title);
                    expect(post.title).to.equal(updatePost.title);
                    expect(post.content).to.equal(updatePost.content);
                    // post.title.should.equal(updateData.title);
                    // post.content.should.equal(updateData.content);
                });
        }); //first PUT it
    }); //PUT describe

    describe('DELETE endpoint', function() {
        it('should delete a blog post', function(){
            //get DB post id, make delete request, check DB to see it's deleted 
            let post;

            return BlogPost 
                .findOne() 
                .then(function(_post) { 
                    //set your post to be deleted equal to _post (what you just found w/findOne)
                    post = _post;
                    return chai.request(app) 
                        .delete(`/posts/${post.id}`);
                })
                //now check that it's deleted by searching for its ID in DB
                .then(function(res){
                    expect(res).to.have.status(204);
                    return BlogPost.findById(post.id);
                })
                .then(function(_post){
                    expect(_post).to.be.null;
                });
        }); //first DELETE it
    }); //DELETE describe 




});

    