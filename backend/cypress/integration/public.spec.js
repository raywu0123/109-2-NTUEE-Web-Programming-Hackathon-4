import 'cypress-file-upload';

const BACKEND = "localhost:5000";
const FRONTEND = "localhost:3000";

const watchList = [
    "基隆市",
    "臺北市",
    "新北市",
    "桃園市",
    "新竹市",
    "新竹縣",
    "苗栗縣",
    "臺中市",
    "彰化縣",
    "南投縣",
    "雲林縣",
    "嘉義市",
    "嘉義縣",
    "臺南市",
    "高雄市",
    "屏東縣",
    "宜蘭縣",
    "花蓮縣",
    "臺東縣",
    "澎湖縣",
    "金門縣",
    "連江縣",
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
            "新竹市",
            "臺北市",
            "新北市",
        ],
    )
}
`;
const queryNoSeverity = `
query statsCount {
    statsCount(
        locationKeywords: [
            "新竹市",
            "臺北市",
            "新北市",
        ],
    )
}
`;

const mutation = `
mutation insertPeople {
  insertPeople(
    data: [{
        ssn: "A1313113",
        name: "AAA",
        severity: 2,
        location: {
            name: "HOME",
            description: "新北市永和區",
        },
    }]
  )
}
`;

function useInvalidData() {
    cy.exec('cp ./src/invalid-data.json ./src/data.json');
}
function useValidData() {
    cy.exec('cp ./src/valid-data.json ./src/data.json');
}


describe('Hackathon 4 Public Test', () => {
    it('2-1 query response have correct properties ()', () => {
        useValidData();
        postToBackend(query)
        .then(res => {
            const result = res.body;
            expect(result).to.have.property('data');
            expect(result.data).to.have.property("statsCount");
        })
    })
    it('2-2 query with severity have correct result ()', () => {
        useValidData();
        postToBackend(query)
        .then(res => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq([0, 0, 0]);
        })
    })
    it('2-3 query with no severity have correct result ()', () => {
        useValidData();
        postToBackend(queryNoSeverity)
        .then(res => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq([1, 0, 0]);
        })
    })
    it('2-4 query should return null when db fails ()', () => {
        useInvalidData();
        postToBackend(query)
        .then(res => {
            const result = res.body;
            expect(result.data.statsCount).to.be.null;
        })
    })
    it('3-1 mutation response have correct properties ()', () => {
        useValidData();
        postToBackend(mutation)
        .then(res => {
            const result = res.body;
            expect(result).to.have.property("data");
            expect(result.data).to.have.property("insertPeople");
        })
    })
    it('3-2 mutation response have correct result ()', () => {
        useValidData();
        postToBackend(mutation)
        .then(res => {
            const result = res.body;
            expect(result.data.insertPeople).to.be.true;
        })
    })
    it('3-3 mutation and query return updated result, new ssn ()', () => {
        useValidData();
        postToBackend(mutation)
        .then(() => postToBackend(query))
        .then((res) => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq([0, 0, 1]);
        })
    })
    it('3-4 mutation and query return updated result, duplicate ssn ()', () => {
        useValidData();
        postToBackend(mutation)
        .then(() => postToBackend(mutation))  // a second mutation
        .then(() => postToBackend(query))
        .then((res) => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq([0, 0, 1]);
        })
    })
    it('3-5 mutation should return false when db fails ()', () => {
        useInvalidData();
        postToBackend(mutation)
        .then((res) => {
            const result = res.body;
            expect(result.data.insertPeople).to.be.false;
        })
    })
    it('4-1 stats page renders correctly ()', () => {
        useValidData();
        cy.visit(FRONTEND);
        const ansCounts = [
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0,
        ];
        watchList.forEach((keyword, idx) => {
            cy.get(`#count-${idx}`).should('contain', ansCounts[idx]);
        });
    })
    it('5-1 upload page mutates data ()', () => {
        useValidData();
        cy.visit(FRONTEND + '/upload');
        cy.get('input[type="file"]').attachFile('people.csv');
        const ansCounts = [
            0, 1, 0, 
        ];
        cy.wait(100);
        postToBackend(query)
        .then(res => {
            const result = res.body;
            expect(result.data.statsCount).to.deep.eq(ansCounts);
        });
    })
    it('6-1 subscription updates data ()', () => {
        useValidData();
        cy.visit(FRONTEND);
        cy.wait(100);

        postToBackend(mutation);
        cy.wait(100);
        const ansCounts = [
            0, 0, 1, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0,
        ];
        watchList.forEach((keyword, idx) => {
            cy.get(`#count-${idx}`).should('contain', ansCounts[idx]);
        });
    })
})