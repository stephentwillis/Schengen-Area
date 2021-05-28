# Travel App 

## Stephen Willis
App credentials can be found in the Methodology readme, so much more I wanted to do for this! Many thanks for your kind consideration. 

Please run the solution locally using 'npm run test'

## Introduction 
To comply with EU regulations, we need to monitor the days our UK passport holding staff spend in Schengen countries. There is a legal limit to not exceed 90 days within the Schengen area in a rolling 180-day window.  

Thus, please create a tool that monitors total days spent abroad knowing that: 
- **garage crew** spend **10 days** out per event  
- **mechanics** spend **6 days** out per race event, X + 3 per test event (X being the number of test days)  
- **engineers** spend **5 days** out per race event, X + 2 per test event (X being the number of test days)  
- **marketing personnel** spend **7 days** out per race event and X days for test events.  

**All team members** need to have a means to enter their **private travels** (days in location) as holidays also count towards the 90 in 180-day limit. 

The travel department need to be able to add events (race or test) at future dates and see the effect on individuals’ totals.

## Tech guidelines: 

1. We are looking for a web-app compatible with all modern browsers, robust, maintainable, with a good user interface and rich in functionalities

   - You can use any language of your choice, as well as any library you think is necessary 

2. You can store the app related data in any database or file format you prefer. 

    - If it’s a local instance of a DB, please commit to the repository also the schema and the scripts to create and populate the DB with the right data to let us test your solution. 

    - If you adopt a DB cloud-based solution, please add to the repo the details on how to connect to the cloud database.

3. You can retrieve the list of events and members of personnel from these two endpoints. You can assume they work as two API endpoints you query to retrieve the latest up-to-date information. The `date` is expressed with the format `DD/MM/YYYY`:

   - Events: [https://mbgp-raceeng.github.io/events.json](https://mbgp-raceeng.github.io/events.json )

    - Members of personnel: [https://mbgp-raceeng.github.io/users.json](https://mbgp-raceeng.github.io/users.json )

4. The platform requires users to login to add their own personal travels: unlike a real-world solution, the login system doesn’t need to be sophisticated and bomb-proof.  Remember to give us some login credentials to test your solution.

## Event Code explanation

### Race Example

`03_20Mel` - Melbourne Race on March 20th, same name/date structure applies for all races below. 
***STW: this formatting is not consistently applied across events, compare 04_18Imo (Venue: Imola) & 05_02Por (Venue: Portugal) with 05_09Bcn (Venue: Barcelona), 05_23Mco (Venue: Monaco), 06_13Mtl (Montreal? Venue: Canada), 06_27Prd (Paul Ricard? Venue: France). Also 06_05Bak yet the date property is set at 05/05/2022!***
- Free Practice 1 (FP1) and Free Practice 2 (FP2) happen on March 18th
- Free Practice 3 (FP3) and Qualifying (Qu) happen on March 19th
- The Race happens on March 20th.


### Test Example

`Bah03_12` - Bahrain Test started on March 12th. 
If the test lasts 4 days it means
- 1st day of testing is March 12th
- 2nd day of testing is March 13th
- 3rd day of testing is March 14th
- 4th day of testing is March 15th
