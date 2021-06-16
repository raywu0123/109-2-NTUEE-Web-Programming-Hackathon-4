import 'cypress-file-upload';

const BACKEND = "localhost:5000";
const FRONTEND = "localhost:3000";

const watchList = [
    'California',
    'New York',
    'New Mexico',
    'Alabama',
];

function postToBackend(query) {
    return cy.request({
        method: "POST",
        url: BACKEND,
        headers: {
            'content-type': 'application/json',
            'accept': 'application/json',
        },
        body: JSON.stringify({
            query
        }),  
        failOnStatusCode: false,
    })
}
const query = `
query statsCount {
    statsCount(
        severity: 1,
        locationKeywords: [
            "California",
            "New York",
            "New Mexico",
            "Alabama",
        ],
    )
}
`;
const queryNoSeverity = `
query statsCount {
    statsCount(
        locationKeywords: [
            "California",
            "New York",
            "New Mexico",
            "Alabama",
        ],
    )
}
`;

const mutation = `
mutation insertPeople {
  insertPeople(
    data: [
        {
            ssn: "M888",
            name: "Marshall Ericson",
            severity: 2,
            location: {
                name: "Home",
                description: "East Meadow, Long Island, New York"
            }
        },
        {
            ssn: "L222",
            name: "Lily Aldrin",
            severity: 2,
            location: {
                name: "Home",
                description: "East Meadow, Long Island, New York"
            }
        },
        {
            ssn: "A199999999",
            name: "Prof. Dave",
            severity: 0,
            location: {
                name: "UC Berkeley",
                description: "VPCR+QH Berkeley, California, United States"
            }
        },
        {
            ssn: "J777",
            name: "Jenny Curran",
            severity: 1,
            location: {
                name: "University of Alabama",
                description: "6F63+8G Tuscaloosa, Alabama, United States"
            }
        },
    ]
  )
}
`;

function useInvalidData() {
    cy.exec('cp ./src/invalid-data.json ./src/data.json');
}
function useValidData() {
    cy.exec('cp ./src/valid-data.json ./src/data.json');
}


describe('Hackathon 4 Private Test', () => {
    it('2-1 query response have correct properties (1%)', () => {
        useValidData();
        postToBackend(query)
        .then(res => {
            const result = res.body;
            expect(result).to.have.property('data');
            expect(result.data).to.have.property("statsCount");
        })
    })
    it('2-2 query with severity have correct result (8%)', () => {
        useValidData();
        postToBackend(query)
        .then(res => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq([1, 3, 3, 0]);
        })
    })
    it('2-3 query with no severity have correct result (8%)', () => {
        useValidData();
        postToBackend(queryNoSeverity)
        .then(res => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq([1, 6, 3, 1]);
        })
    })
    it('2-4 query should return null when db fails (3%)', () => {
        useInvalidData();
        postToBackend(query)
        .then(res => {
            const result = res.body;
            expect(result.data.statsCount).to.be.null;
        })
    })
    it('3-1 mutation response have correct properties (1%)', () => {
        useValidData();
        postToBackend(mutation)
        .then(res => {
            const result = res.body;
            expect(result).to.have.property("data");
            expect(result.data).to.have.property("insertPeople");
        })
    })
    it('3-2 mutation response have correct result (1%)', () => {
        useValidData();
        postToBackend(mutation)
        .then(res => {
            const result = res.body;
            expect(result.data.insertPeople).to.be.true;
        })
    })
    it('3-3 mutation and query return updated result, new ssn (8%)', () => {
        useValidData();
        postToBackend(mutation)
        .then(() => postToBackend(query))
        .then((res) => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq([0, 5, 3, 1]);
        })
    })
    it('3-4 mutation and query return updated result, duplicate ssn (8%)', () => {
        useValidData();
        postToBackend(mutation)
        .then(() => postToBackend(mutation))  // a second mutation
        .then(() => postToBackend(query))
        .then((res) => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq([0, 5, 3, 1]);
        })
    })
    it('3-5 mutation should return false when db fails (2%)', () => {
        useInvalidData();
        postToBackend(mutation)
        .then((res) => {
            const result = res.body;
            expect(result.data.insertPeople).to.be.false;
        })
    })
    it('4-1 stats page renders correctly (20%)', () => {
        useValidData();
        cy.visit(FRONTEND);
        const ansCounts = [1, 3, 3, 0];
        watchList.forEach((keyword, idx) => {
            cy.get(`#count-${idx}`).should('contain', ansCounts[idx]);
        });
    })
    it('5-1 upload page mutates data (20%)', () => {
        useValidData();
        cy.visit(FRONTEND + '/upload');
        cy.get('input[type="file"]').attachFile('people.csv');
        const ansCounts = [5, 5, 4, 1];
        cy.wait(100);
        postToBackend(query)
        .then(res => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq(ansCounts);
        });
    })
    it('6-1 subscription updates data (20%)', () => {
        useValidData();
        cy.visit(FRONTEND);
        cy.wait(100);

        postToBackend(mutation);
        cy.wait(100);
        const ansCounts = [0, 5, 3, 1];
        watchList.forEach((keyword, idx) => {
            cy.get(`#count-${idx}`).should('contain', ansCounts[idx]);
        });
    })
})