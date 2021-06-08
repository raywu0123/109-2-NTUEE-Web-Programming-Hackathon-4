import { GraphQLServer, PubSub } from 'graphql-yoga';

import db from './db';
import Query from './resolvers/Query';
import Mutation from './resolvers/Mutation';
import Subscription from './resolvers/Subscription';

// console.log('CALL', Object.keys(db));
// console.log('CALL', db.people)
// console.log('CALL', db.people[0])
// console.log('CALL', db.people[0].severity += 1)
// console.log('CALL', db.people[0].name += ' 3000')
// console.log('CALL', Object.keys(db.people[0]));

const pubsub = new PubSub();

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers: {
        Query,
        Mutation,
        Subscription,
    },
    context: {
        db,
        pubsub,
    },
});

server.start({ port: process.env.PORT | 5000 }, () => {
    console.log(`The server is up on port ${process.env.PORT | 5000}!`);
});
