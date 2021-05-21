const config = {
    endpoints: [
        'https://mbgp-raceeng.github.io/events.json',
        'https://mbgp-raceeng.github.io/users.json'
    ],
    roles: [
        'garage',
        'mechanic',
        'engineer',
        'marketing'
    ],
    eventDays: { // Date weirdness here, particularly with Test events, I'm sure its to do with parsing datetimes without accounting for 23:59:59 effectively being a whole day
        race: { // [daysBefore, daysAfter] don't include the actual event date in count, use this as the 'split' point!
            garage: [7, 2], // 10 days
            mechanic: [4, 1], // 6                Spliting the dates like this allows us to model a slighly more realistic pattern of events.
            engineer: [3, 1], // 5                Garage team members would likely travel out sooner, than mechanics and engineers, to get the 
            marketing: [5, 1] // 7                pit boxes and mobile offices ready for instance...
        },
        test: { // [daysBefore, daysAfter] don't include the actual event date in count, use this as the 'split' point!
            garage: [4, 1], // 10 days
            mechanic: [2, 0], // Duration plus 3; 
            engineer: [1, 0], // Duration plus 2; 
            marketing: [0, -1] // Duration
        }  
    },
    credentials: [
        {
            username: 'TravelDept',
            password: 'M-Amg_P_F1'
        }
    ],
    schengenLimits: {
        period: 180,
        limit: 90
    }
};

module.exports = config;