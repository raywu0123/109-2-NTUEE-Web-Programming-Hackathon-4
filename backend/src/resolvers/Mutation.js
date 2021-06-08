function copy(object) {
    return JSON.parse(JSON.stringify(object));
}


const Mutation = {
    insertPeople(parent, args, { db, pubsub }, info) {
        const deleted = [];
        try {
            args.data.forEach((person) => {
                const index = db.people.findIndex((db_person => db_person.ssn === person.ssn));
                if (index >= 0) {
                    deleted.push(copy(db.people[index]))
                    db.people.splice(index, 1);
                }
                db.people.push({...person});
            })
    
            pubsub.publish('PEOPLE', {
                people: {
                    inserted: args.data,
                    deleted: deleted,
                }
            })
            return true;
        } catch {
            return false;
        }

    },
}

export default Mutation;
