const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const expect = chai.expect;

const {BlogPost} = require('../models');
const {runServer, app, closeServer} = require('../server');
const {DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function generateBlogData() {
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
        seedData.push(generateBlogData());
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
                    expect(res).to.have.status(200);
                    expect(res.body.posts).to.have.length.of.at.least(1);
                    return BlogPost.count();
                })
                .then(function(count) {
                    expect(res.body.posts).to.have.length.of(count);
                });
        }); //it
    }); //describe



});

    