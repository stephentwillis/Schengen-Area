const config = {
    endpoints: [
        'https://mbgp-raceeng.github.io/events.json',
        'https://mbgp-raceeng.github.io/users.json'
    ],
    eventDays: {
        race: {
            garage: 10,
            mechanic: 6,
            engineer: 5,
            marketing: 7
        },
        test: {
            garage: 10,
            mechanic: 3,
            engineer: 2,
            marketing: 0
        }  
    },
    credentials: [
        {
            username: 'TravelDept',
            password: 'M-Amg_P_F1'
        }
    ]
};

module.exports = config;