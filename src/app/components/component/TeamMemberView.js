//#region Import Libraries
import React, { useState, useEffect } from 'react';
import merge from 'lodash/merge';
import reduce from 'lodash/reduce';
import orderBy from 'lodash/orderBy';
import DatePicker from 'react-date-picker';
import moment from 'moment';
import axios from 'axios';
import { Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';
const CosmosClient = require("@azure/cosmos").CosmosClient;

import EventCard from './EventCard';
import EventRow from './EventRow';

import config from '../../../config';
import CosmosConfig from "../../../CosmosConfig";

import schengenEvents from "../../../data/schengenEvents";
import schengenArea from "../../../data/schengenArea";
//#endregion

const TeamMemberView = ({logout}) => {

    // #region Variables
    let initialAnnualLeave = {
        id: 0,
        startdate: moment().format('DD/MM/YYYY').toString(),
        enddate: moment().format('DD/MM/YYYY').toString(),
        destination: "",
        totaldays: 0,
        isschengen: false
    };

    const Now = moment();

    const spinner = <i className="fad fa-tire fa-spin petronas"></i>;
    // #endregion 

    // #region State Handling

    // Team Member
    const [teamMember, updateTeamMember] = useState([]); // Get this on first load only, update holiday and hold in separate object until write
    const [teamMemberHolidays, updateTeamMemberHolidays] = useState([]);
    const [filteredTeamMemberHolidays, filterTeamMemberHolidays] = useState([]); 
    const [newHoliday, updateNewHoliday] = useState(initialAnnualLeave);

    // Dates
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Events
    const [allEvents, updateAllEvents] = useState([]); // Get this on first load only, mutate but don't filter
    const [additionalEvents, updateAdditionalEvents] = useState([]);
    const [orderedEvents, updateOrderedEvents] = useState([]);
    const [filteredEvents, updateFilteredEvents] = useState([]);

    // Further filtered events
    const [SchengenRaceEvents, setSchengenRaceEvents] = useState({}); 
    const [SchengenTestEvents, setSchengenTestEvents] = useState({});
    const [SchengenHolidayEvents, setSchengenHolidayEvents] = useState({});

    // Arrays of dates for filtered events 
    const [SchengenRaceDates, setSchengenRaceDates] = useState([]);
    const [SchengenTestDates, setSchengenTestDates] = useState([]);
    const [SchengenHolidayDates, setSchengenHolidayDates] = useState([]);

    // Progress bar values
    const [totalDays, setTotalDays] = useState(0);
    const [totalWidth, setTotalWidth] = useState(0);
    const [raceWidth, setRaceWidth] = useState(0);
    const [testWidth, setTestWidth] = useState(0);
    const [holidayWidth, setHolidayWidth] = useState(0);

    // show/hide DOM elements
    const [showMySchengen, toggleMySchengenState] = useState(true);
    const [showMySchedule, toggleMyScheduleState] = useState(true);
    const [showFullSchedule, toggleFullScheduleState] = useState(false);
    const [showAnnualLeave, toggleAnnualLeaveState] = useState(true);
    const [showForm, toggleFormState] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

    // Update in side effect?
    const [updateEvents, setUpdateEventStatus] = useState(false);
    const [updateHoliday, setUpdateHolidayStatus] = useState(false);

    // Loading States
    const [isLoadingTeamMember, updateLoadingTeamMember] = useState(true);


    useEffect(() => {                
        fillTeamMember();
        fillEvents();
    }, []);
    
    useEffect(() => {
        setUpdateHolidayStatus(true);
        updateTeamMemberHolidays(teamMember.travel);
    }, [teamMember])

    useEffect(() => {
        if (updateHoliday) {
            filterEvents();
        }
        setUpdateHolidayStatus(false);
        updateLoadingTeamMember(false);

        setDefaultDates();
    },[teamMemberHolidays]); 
    
    useEffect(() => {        
        if (updateEvents) {
            mutateEvents();
        }
        setUpdateEventStatus(false);
    }, [allEvents]);       
    
    useEffect(() => {
        filterEvents();
    }, [orderedEvents]);

    useEffect(() => {
        filterEvents();
    },[startDate]);
    
    useEffect(() => {
        let dates = reduce(SchengenRaceEvents, (acc, event) => {
            acc.push(event.dates[teamMember.role]);
            return acc;
        },[]);

        // Lets flatten that array of arrays!
        setSchengenRaceDates([].concat.apply([], dates));
           
    }, [SchengenRaceEvents])

    useEffect(() => {        

        let dates = reduce(SchengenTestEvents, (acc, event) => {
            acc.push(event.dates[teamMember.role]);
            return acc;
        },[]);

        // Lets flatten that array of arrays!
        setSchengenTestDates([].concat.apply([], dates));
               
    }, [SchengenTestEvents])

    useEffect(() => {        

        let dates = reduce(SchengenHolidayEvents, (acc, holiday) => {
            acc.push(holiday.dates);
            return acc;
        },[]);

        // Lets flatten that array of arrays!
        setSchengenHolidayDates([].concat.apply([], dates));

    }, [SchengenHolidayEvents])

    useEffect(() => {

        setTotalDays(SchengenRaceDates.length + SchengenTestDates.length + SchengenHolidayDates.length);

    }, [SchengenRaceDates, SchengenTestDates, SchengenHolidayDates]);

    useEffect(() => {        
        let limitDivisor = (config.schengenLimits.limit / 100);        
        
        setTotalWidth(totalDays/limitDivisor);
        setRaceWidth(SchengenRaceDates.length/limitDivisor);
        setTestWidth(SchengenTestDates.length/limitDivisor);
        setHolidayWidth(SchengenHolidayDates.length/limitDivisor);

        renderGauge();

    }, [totalDays])

    // #endregion

    //#region Event Handlers
    const change = (e) =>  { 
        updateNewHoliday({
            ...newHoliday,
            [e.target.name]: e.target.value.trim() 
        });
    }

    const changeDate = (name, date) =>  { 
        let tempDate;
        
        if (date != null) {
            tempDate = moment(date)

            // Account for the last day being a whole day!
            if (name == 'enddate') {
                tempDate.add(1, 'days');
            }
        } else {
            tempDate = Now;
        }

        updateNewHoliday({
            ...newHoliday,
            [name]: tempDate.format('DD/MM/YYYY').toString()
        });
    }

    const changeDateRange = (name, date) =>  { 
        if (date != null) {
            let tempDate = moment(date)

            // Account for the last day being a whole day!
            if (name == 'endDate') {
                tempDate.add(1, 'days');
            }

            setStartDate(tempDate.format('YYYY-MM-DD').toString());
            setEndDate(tempDate.add(config.schengenLimits.period, 'days').format('YYYY-MM-DD').toString());
        } else {
            setDefaultDates();
        }
    }

    const toggleMySchengen = () => {
        toggleMySchengenState(!showMySchengen);
    }

    const togglePopover = () => {
        setPopoverOpen(!popoverOpen);
    }

    const toggleMySchedule = () => {
        toggleMyScheduleState(!showMySchedule);
    }

    const toggleFullSchedule = () => {
        toggleFullScheduleState(!showFullSchedule);
    }

    const toggleAnnualLeave = () => {
        toggleAnnualLeaveState(!showAnnualLeave);
    }

    const toggleForm = () => {
        toggleFormState(!showForm);
    }
    //#endregion

    // #region Methods
    const fillTeamMember = () => { 
        async function getUser() {
    
            // Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
    
            const client = new CosmosClient({ endpoint, key });
    
            const database = client.database(databaseId);
            const container = database.container("User");
    
            const querySpec = {
                query: "SELECT * from c"
            };    
            
            const teamMemberTravels = await container.items
                .query(querySpec)
                .fetchAll();
            // -- Cosmos DB

            let user = JSON.parse(localStorage.getItem("user"));            

            user.isSchengen = user.nationality == 'UK';
            
            updateTeamMember(merge(user, teamMemberTravels.resources.filter(x => x.email == user.email)[0]));
        }
        getUser();  
    }   

    const addAnnualLeave = () => {
        async function update() {
            // Update object
            newHoliday.id = teamMember.travel.length;
            newHoliday.isschengen = schengenArea.indexOf(newHoliday.destination) > -1;            
            newHoliday.totaldays = moment(newHoliday.enddate, 'DD/MM/YYYY').diff(moment(newHoliday.startdate, 'DD/MM/YYYY'), 'days');

            let allDates = [];
            let from = moment(newHoliday.startdate, 'DD/MM/YYYY');
            let to = moment(newHoliday.enddate, 'DD/MM/YYYY');

            while (from < to) {
                allDates.push(from.format('YYYY-MM-DD'));
                from = from.add(1, 'days');
            }

            newHoliday.dates = allDates;

            // push object into team member travel array
            teamMember.travel.push(newHoliday);

            // update Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
        
            const client = new CosmosClient({ endpoint, key });

            const database = client.database(databaseId);
            const container = database.container("User");

            const updatedTeamMember = await container
                .item(teamMember.id, teamMember.email)
                .replace(teamMember);

            setUpdateHolidayStatus(true);
            updateTeamMember(updatedTeamMember);
        }
        update();
    }

    const deleteAnnualLeave = (id) => {   
        async function update() {     
            teamMember.travel.splice(id, 1);

            // update Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
        
            const client = new CosmosClient({ endpoint, key });

            const database = client.database(databaseId);
            const container = database.container('User');

            const updatedTeamMember = await container
                .item(teamMember.id, teamMember.email)
                .replace(teamMember);

            setUpdateHolidayStatus(true);
            updateTeamMember(updatedTeamMember);
        }
        update();        
    }

    const setDefaultDates = () => {
        setUpdateEventStatus(true);
        setStartDate(Now.format('YYYY-MM-DD').toString());
        setEndDate(Now.add(config.schengenLimits.period, 'days').format('YYYY-MM-DD').toString());        
    }

    const fillEvents = () => { 
        async function getEvents() {
            const apiEvents = await axios({
                method: 'get',
                url: config.endpoints[0]
            });

            // Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
    
            const client = new CosmosClient({ endpoint, key });
    
            const database = client.database(databaseId);
            const container = database.container('AdditionalEvent');
    
            const querySpec = {
                query: "SELECT * from c"
            };    
            
            let res = await container.items
                .query(querySpec)
                .fetchAll();
            
            updateAdditionalEvents(res.resources);
            // -- Cosmos DB 
            
            let mergedEvents = merge(apiEvents.data, res.resources);

            setUpdateEventStatus(true);
            updateAllEvents(mergedEvents);
        }
        getEvents();
    }

    const mutateEvents = () => {
        // I'm sure there is a more elegant way of doing this!
        // Munging on read will have performance costs.
        for (let i = 0; i < allEvents.length; i++) {
            let index = schengenEvents.findIndex(x => x.venue === allEvents[i].venue);

            allEvents[i].title = schengenEvents[index].title;
            allEvents[i].circuit = schengenEvents[index].circuit;
            allEvents[i].isSchengen = schengenEvents[index].isSchengen;
            allEvents[i].orderDate = moment(allEvents[i].date, 'DD-MM-YYYY').format('YYYY-MM-DD');           

            allEvents[i].RaceDayOne = moment(allEvents[i].date, 'DD/MM/YYYY').subtract(2, 'days').format('YYYY-MM-DD');
            allEvents[i].RaceDayTwo = moment(allEvents[i].date, 'DD/MM/YYYY').subtract(1, 'days').format('YYYY-MM-DD');

            if (allEvents[i].type.toLowerCase() == 'test') {
                allEvents[i].TestTo = moment(allEvents[i].date, 'DD/MM/YYYY').add(allEvents[i].duration, 'days').format('YYYY-MM-DD');
            }

            // Build Array of event dates and push into event object
            // hate nested loops            
            let garage = [];
            let mechanic = [];
            let engineer = [];
            let marketing = [];

            let from = moment(allEvents[i].orderDate, 'YYYY-MM-DD');
            let to = moment(allEvents[i].orderDate, 'YYYY-MM-DD');


            // Could refactor this into another loop and programmatically look up the role and date offsets
            // but I really hate loops in loops in loops - Big O (asymtotic complexity)

            // Race      
            if (allEvents[i].type.toLowerCase() == 'race') {      
                
                // Garage
                from.subtract(config.eventDays.race.garage[0], 'days');
                to.add(config.eventDays.race.garage[1], 'days');

                while (from <= to) {
                    garage.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }

                // Mechanic
                from = moment(allEvents[i].orderDate);
                to = moment(allEvents[i].orderDate);
                from.subtract(config.eventDays.race.mechanic[0], 'days');
                to.add(config.eventDays.race.mechanic[1], 'days');

                while (from <= to) {
                    mechanic.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }

                // Engineer
                from = moment(allEvents[i].orderDate);
                to = moment(allEvents[i].orderDate);
                from.subtract(config.eventDays.race.engineer[0], 'days');
                to.add(config.eventDays.race.engineer[1], 'days');

                while (from <= to) {
                    engineer.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }                

                // Marketing
                from = moment(allEvents[i].orderDate);
                to = moment(allEvents[i].orderDate);
                from.subtract(config.eventDays.race.marketing[0], 'days');
                to.add(config.eventDays.race.marketing[1], 'days');

                while (from <= to) {
                    marketing.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }
            } else {
                to = moment(allEvents[i].TestTo);

                // Garage
                from.subtract(config.eventDays.test.garage[0], 'days');
                to.add(config.eventDays.test.garage[1], 'days');

                while (from <= to) {
                    garage.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }

                // Mechanic
                from = moment(allEvents[i].orderDate);
                to = moment(allEvents[i].TestTo);
                from.subtract(config.eventDays.test.mechanic[0], 'days');
                to.add(config.eventDays.test.mechanic[1], 'days');

                while (from <= to) {
                    mechanic.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }

                // Engineer
                from = moment(allEvents[i].orderDate);
                to = moment(allEvents[i].TestTo);
                from.subtract(config.eventDays.test.engineer[0], 'days');
                to.add(config.eventDays.test.engineer[1], 'days');

                while (from <= to) {
                    engineer.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }                

                // Marketing
                from = moment(allEvents[i].orderDate);
                to = moment(allEvents[i].TestTo);
                from.subtract(config.eventDays.test.marketing[0], 'days');
                to.add(config.eventDays.test.marketing[1], 'days');

                while (from <= to) {
                    marketing.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }
            }

            let enumeratedDates = {};
            enumeratedDates.garage = garage;
            enumeratedDates.mechanic = mechanic;
            enumeratedDates.engineer = engineer;
            enumeratedDates.marketing = marketing;

            allEvents[i].dates = enumeratedDates;

            // console.log(allEvents[i]);
        }   

        // Update allEvents object but not updating flag otherwise we'll end up in a infinite loop!
        updateOrderedEvents(orderBy(allEvents, 'orderDate', 'asc'));  
    }

    const filterEvents = () => { 
        if (orderedEvents != undefined && orderedEvents.length > 0) {
            // Update Event Filters
            updateFilteredEvents(orderedEvents.filter(x => x.orderDate >= startDate && x.orderDate <= endDate));

            // RACES
            setSchengenRaceEvents(orderedEvents.filter(x => x.type.toLowerCase() == 'race' && x.orderDate >= startDate && x.orderDate <= endDate && x.isSchengen));
            
            // TESTS
            setSchengenTestEvents(orderedEvents.filter(x => x.type.toLowerCase() == 'test' && x.orderDate >= startDate && x.orderDate <= endDate && x.isSchengen));
        }

        if (teamMemberHolidays != undefined && teamMemberHolidays.length > 0) {
            // HOLIDAYS
            setSchengenHolidayEvents(teamMemberHolidays.length > 0 ? teamMemberHolidays.filter(x => x.isschengen && moment(x.startdate, 'DD/MM/YYYY').format('YYYY-MM-DD') >= startDate && moment(x.enddate, 'DD/MM/YYYY').format('YYYY-MM-DD') <= endDate) : 0);
        }
    }
    // #endregion

    // #region Gauge
    const renderGauge = () => {
        // Set Up -- REMEMBER WE'RE DEALING WITH RADIANS HERE NOT DEGREES, 360 (or Tau) = 2(PI x R), therefore 180 (or PI) = PI x R
        let target = '#arc-gauge';
        let segment = Math.PI / 100; // further divide by two as the arc we're building is plus or minus 1.57 rad
        let zeroPoint = config.schengenLimits.limit / 2;
        let NinetyDegreesInRads = 1.57;
        let totaldays = totalDays;

        let width = 370, height = 210;
        let iR = 90, oR = 100;
        let color = '#0CA597'; 
        let max = 90, min = 0, current = 0;
        let arc = d3.svg.arc().innerRadius(iR).outerRadius(oR).startAngle(-NinetyDegreesInRads); // Arc Defaults

        // Make sure there is only one gauge left after all the renders!
        d3.select(target).html('');

        // Place svg element
        let svg = d3.select(target).append("svg").attr("width", width).attr("height", 125).append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        let background = svg.append("path").datum({endAngle:  NinetyDegreesInRads}).style("fill", "#ddd").attr("d", arc); // Append background arc to svg
        let foreground = svg.append("path").datum({endAngle: -NinetyDegreesInRads}).style("fill", color).attr("d", arc); // Append foreground arc to svg

        // Display Max value
        let maxText = svg.append("text").attr("transform", "translate("+ (iR + ((oR - iR) / 2)) +",15)").attr("text-anchor", "middle").style("fill", "#fff").style("font-family", "'MBCorpo Text', Arial, Helvetica, sans-serif").text(max); // Set between inner and outer Radius

        // Display Min value
        let minText = svg.append("text").attr("transform", "translate("+ -(iR + ((oR - iR) / 2)) +",15)").attr("text-anchor", "middle").style("fill", "#fff").style("font-family", "'MBCorpo Text', Arial, Helvetica, sans-serif").text(min); // Set between inner and outer Radius

        // Display Current value, Push up from center 1/4 of innerRadius
        let currentText = svg.append("text").attr("text-anchor", "middle").style("font-size", "30").style("fill", "#0CA597").style("font-family", "'MBCorpo Text', Arial, Helvetica, sans-serif").text(current);

        let value;
        if (totaldays > 0) {
            //value = Math.floor(totalDays - 45) * multiplier; // Get value
            
            if (totaldays > zeroPoint) {
                // +ve value up to 1.57rad
                value = totaldays * 0.0157;

            } else if (totaldays < zeroPoint) {
                //-ve values down to -1.57rad
                // inverse
                value = -(NinetyDegreesInRads - (totaldays * segment));

            } else {
                value = 0; // hard set to 0 radians, bang in the middle
            }

        } else {
            value = -NinetyDegreesInRads; // -1.57rads or approx. -90d
        }

        currentText.transition().text(totalDays + ' days'); // Text transition
                                
        // Arc Transition
        foreground.transition().duration(750).call(arcTween, value);

        function arcTween(transition, newAngle) {
            transition.attrTween("d", function(d) {
                let interpolate = d3.interpolate(d.endAngle, newAngle);
                    return function(t) {
                        d.endAngle = interpolate(t);  
                        return arc(d);  
                };  
            }); 
        } // Update animation
    } 
    // #endregion
    
    //#region Render
    return (
        <article id="team-member" className="container">
            <section id="header" className="mb-5">
                <div className="row">
                    <div className="col">
                        <h1 className="petronas">My Account</h1>                           
                    </div>
                    <div className="col">
                        <button type="submit" className="btn btn-primary bg-petronas float-right" onClick={(e) => { logout(); }}>Log Out</button>
                    </div>
                </div>
                <div className="row">
                    <div className="col col-md-1">
                        <div className="icon bg-petronas mt-1">
                            { isLoadingTeamMember ? spinner: 
                            (teamMember.role == 'garage') ? 
                            <i className="fas fa-warehouse"></i>
                            : (teamMember.role == 'mechanic') ?
                            <i className="fas fa-tools"></i>
                            : (teamMember.role == 'engineer') ?
                            <i className="fas fa-cogs"></i>
                            : (teamMember.role == 'marketing') ?
                            <i className="fas fa-award"></i>
                            : null
                            }
                        </div>
                    </div>
                    <div className="col col-md-10 ml-3">
                        <p>
                            <strong>Name: </strong> { isLoadingTeamMember ? null : teamMember.name + ' ' + teamMember.surname}
                            <br />
                            <strong>Email: </strong> { isLoadingTeamMember ? null : teamMember.email}
                            <br />
                            <strong>Nationality: </strong> { isLoadingTeamMember ? null : teamMember.nationality}
                            <br />
                            <strong>Role: </strong> <span className="capitalize">{ isLoadingTeamMember ? null : teamMember.role}</span>
                        </p> 
                    </div>
                </div>
            </section>


            { teamMember.isSchengen ?
            <section id="my-schengen" className="mb-5">
                <div className="row">
                    <div className="col col-md-5 ma-m pb-0">
                        { !showMySchengen ?
                        <i className="fas fa-angle-right float-right fs-15 petronas pointer mt-2" onClick={() => { toggleMySchengen(); }}></i>
                        :
                        <i className="fas fa-angle-down float-right fs-15 petronas pointer mt-2" onClick={() => { toggleMySchengen(); }}></i>
                        }
                        <h2 className="grey">
                            My Schengen Area Statistics
                            <Button id="why" type="button" className="popover-btn ml-2 grey">
                                ?
                            </Button>
                        </h2>
                        <Popover trigger="focus" placement="bottom" isOpen={popoverOpen} target="why" toggle={togglePopover}>
                            <PopoverHeader className="bg-petronas">Schengen Area Limits</PopoverHeader>
                            <PopoverBody>
                                Due to the UK leaving the EU, there are now travel limits within the Schengen area for UK passport holders.
                                <br /><br />
                                It is important for all UK passport holders to monitor the amount of time, work or holiday, that they spend in the area.
                                <br /><br />
                                UK passport holders can spend no more than 90 days in any 180 day period in the area.
                                <br /><br />
                                The travel department can also see these statistics to help plan team activities effectively.
                            </PopoverBody>
                        </Popover>
                    </div>
                </div>
                
                { !showMySchengen ?
                null :
                <div className="stats">
                    <div className="row dates">
                        <div className="col col-md-3 grey mt-2">
                        <h5>{config.schengenLimits.period} Day Period Start Date: </h5>
                        </div>
                        <div className="col col-md-4">                        
                            <DatePicker className="form-control datepicker" format="dd/MM/yyyy" value={moment(startDate).toDate()} onChange={(e) => { changeDateRange('startDate', e) }} />
                        </div>
                        <div className="col col-md-5 grey mt-2">
                            <h5 className="float-right">Period End Date: {moment(endDate).format('DD/MM/YYYY').toString()}</h5>
                        </div>
                    </div>

                    <div className="row metrics">
                        <div className="col col-md-4" id="arc-gauge"></div>
                        <div className="col col-md-8">
                            <div className="row race">
                                <div className="col col-md-3">
                                    <h6 className="grey mt-2 float-right mr-3">Races:</h6>
                                </div>
                                <div className="col col-md-8 pr-4 threshold">
                                    <div className="progress">
                                        <div className="progress-bar bg-grey" role="progressbar" style={{width: raceWidth + '%'}}>{SchengenRaceDates.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="row tests">
                                <div className="col col-md-3">
                                    <h6 className="grey mt-2 float-right mr-3">Tests:</h6>
                                </div>
                                <div className="col col-md-8 pr-4 threshold">
                                    <div className="progress">
                                        <div className="progress-bar bg-grey" role="progressbar" style={{width: testWidth + '%'}}>{SchengenTestDates.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="row holiday">
                                <div className="col col-md-3">
                                    <h6 className="grey mt-2 float-right mr-3">Holiday:</h6>
                                </div>
                                <div className="col col-md-8 pr-4 threshold">
                                    <div className="progress">
                                        <div className="progress-bar bg-grey" role="progressbar" style={{width: holidayWidth + '%'}}>{SchengenHolidayDates.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                }
            </section>
            : null
            }


            <section id="my-schedule" className="mb-5">
                <div className="row">
                    <div className="col col-md-3">
                        { !showMySchedule ?
                        <i className="fas fa-angle-right float-right fs-15 petronas pointer mt-2 mr-5" onClick={() => { toggleMySchedule(); }}></i>
                        :
                        <i className="fas fa-angle-down float-right fs-15 petronas pointer mt-2 mr-5" onClick={() => { toggleMySchedule(); }}></i>
                        }
                        <h2 className="grey">My Schedule</h2> 
                    </div>
                </div>
                
                { !showMySchedule ?
                null :
                <>
                <div className="row">
                    <div className="col p-0">
                        <h5 className="grey">Upcoming Events</h5>
                    </div>
                </div>
                <div className="row mb-3">
                    <div className="col card-deck">                    
                    { filteredEvents != undefined && filteredEvents.length > 0 && filteredEvents.slice(0, config.upcomingEventCount).map(item => (
                        <div className="card col-md-4" key={item.eventCode}>
                            <EventCard event={item} />
                        </div>
                    ))}
                    </div>
                </div>

                <div className="row">
                    <div className="col col-md-2 p-0">
                        { !showFullSchedule ?
                        <i className="fas fa-angle-right float-right fs-15 petronas pointer mr-5" onClick={() => { toggleFullSchedule(); }}></i>
                        :
                        <i className="fas fa-angle-down float-right fs-15 petronas pointer mr-5" onClick={() => { toggleFullSchedule(); }}></i>
                        }
                        <h5 className="grey">Full Schedule</h5>
                    </div>                    
                </div>
                { !showFullSchedule ?
                    null :
                    filteredEvents != undefined && filteredEvents.length > 0 && filteredEvents.slice(config.upcomingEventCount + 1, filteredEvents.length).map(item => (
                        <div className="row full-schedule-row" key={item.id}>
                            <EventRow event={item} />
                        </div>
                ))}
                </>
                }
            </section>

            <section id="annual-leave" className="mb-5">
                <div className="row">
                    <div className="col col-md-2">
                        { !showAnnualLeave ?
                        <i className="fas fa-angle-right float-right fs-15 petronas pointer mt-2" onClick={() => { toggleAnnualLeave(); }}></i>
                        :
                        <i className="fas fa-angle-down float-right fs-15 petronas pointer mt-2" onClick={() => { toggleAnnualLeave(); }}></i>
                        }
                        <h2 className="grey">My Holiday</h2> 
                    </div>
                </div>

                { !showAnnualLeave ?
                null :
                !showForm ?
                <div className="row">
                    <div className="col col-md-2 add-annual-leave" onClick={() => { toggleForm(); }}>
                        <i className="petronas fas fa-plus-circle pointer float-left"></i>
                        <h6>Add Holiday</h6>
                    </div>             
                </div>
                : 
                <div className="row">
                    <div className="col col-md-2 add-annual-leave" onClick={() => { toggleForm(); }}>
                        <i className="petronas fas fa-times-circle pointer float-left"></i>
                        <h6>Hide</h6>
                    </div>             
                </div>
                }
                
                { !showAnnualLeave ?
                null :
                showForm ? 
                <div id="annual-leave-form" className="row pb-2">
                    <div className="col col-md-1 grey mt-2">
                        <h6 className="float-right">Date From:</h6>
                    </div>
                    <div className="col col-md-3">                        
                        <DatePicker className="form-control datepicker" format="dd/MM/yyyy" value={moment(newHoliday.startdate, 'DD/MM/YYYY').toDate()} onChange={(e) => { changeDate('startdate', e) }} />
                    </div>
                    <div className="col col-md-1 grey mt-2">
                        <h6 className="float-right">Date To:</h6>
                    </div>
                    <div className="col col-md-3">                        
                        <DatePicker className="form-control datepicker" format="dd/MM/yyyy" value={moment(newHoliday.enddate, 'DD/MM/YYYY').toDate()} onChange={(e) => { changeDate('enddate', e) }} />
                    </div>
                    <div className="col col-md-3">
                        <select name="destination" className="form-control" onChange={(e) => { change(e) }}>
                            <option selected>Please choose a destination...</option>
                            <option value="Afghanistan">Afghanistan</option>
                            <option value="Aland Islands">Aland Islands</option>
                            <option value="Albania">Albania</option>
                            <option value="Algeria">Algeria</option>
                            <option value="American Samoa">American Samoa</option>
                            <option value="Andorra">Andorra</option>
                            <option value="Angola">Angola</option>
                            <option value="Anguilla">Anguilla</option>
                            <option value="Antarctica">Antarctica</option>
                            <option value="Antigua and Barbuda">Antigua and Barbuda</option>
                            <option value="Argentina">Argentina</option>
                            <option value="Armenia">Armenia</option>
                            <option value="Aruba">Aruba</option>
                            <option value="Australia">Australia</option>
                            <option value="Austria">Austria</option>
                            <option value="Azerbaijan">Azerbaijan</option>
                            <option value="Bahamas">Bahamas</option>
                            <option value="Bahrain">Bahrain</option>
                            <option value="Bangladesh">Bangladesh</option>
                            <option value="Barbados">Barbados</option>
                            <option value="Belarus">Belarus</option>
                            <option value="Belgium">Belgium</option>
                            <option value="Belize">Belize</option>
                            <option value="Benin">Benin</option>
                            <option value="Bermuda">Bermuda</option>
                            <option value="Bhutan">Bhutan</option>
                            <option value="Bolivia">Bolivia</option>
                            <option value="Bonaire, Saint Eustatius and Saba">Bonaire, Saint Eustatius and Saba</option>
                            <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                            <option value="Botswana">Botswana</option>
                            <option value="Bouvet Island">Bouvet Island</option>
                            <option value="Brazil">Brazil</option>
                            <option value="British Indian Ocean Territory">British Indian Ocean Territory</option>
                            <option value="Brunei Darussalam">Brunei Darussalam</option>
                            <option value="Bulgaria">Bulgaria</option>
                            <option value="Burkina Faso">Burkina Faso</option>
                            <option value="Burundi">Burundi</option>
                            <option value="Cambodia">Cambodia</option>
                            <option value="Cameroon">Cameroon</option>
                            <option value="Canada">Canada</option>
                            <option value="Cape Verde">Cape Verde</option>
                            <option value="Cayman Islands">Cayman Islands</option>
                            <option value="Central African Republic">Central African Republic</option>
                            <option value="Chad">Chad</option>
                            <option value="Chile">Chile</option>
                            <option value="China">China</option>
                            <option value="Christmas Island">Christmas Island</option>
                            <option value="Cocos (Keeling) Islands">Cocos (Keeling) Islands</option>
                            <option value="Colombia">Colombia</option>
                            <option value="Comoros">Comoros</option>
                            <option value="Congo">Congo</option>
                            <option value="Congo, The Democratic Republic of the">Congo, The Democratic Republic of the</option>
                            <option value="Cook Islands">Cook Islands</option>
                            <option value="Costa Rica">Costa Rica</option>
                            <option value="Cote d'Ivoire">Cote d'Ivoire</option>
                            <option value="Croatia">Croatia</option>
                            <option value="Cuba">Cuba</option>
                            <option value="Curacao">Curacao</option>
                            <option value="Cyprus">Cyprus</option>
                            <option value="Czech Republic">Czech Republic</option>
                            <option value="Denmark">Denmark</option>
                            <option value="Djibouti">Djibouti</option>
                            <option value="Dominica">Dominica</option>
                            <option value="Dominican Republic">Dominican Republic</option>
                            <option value="Ecuador">Ecuador</option>
                            <option value="Egypt">Egypt</option>
                            <option value="El Salvador">El Salvador</option>
                            <option value="Equatorial Guinea">Equatorial Guinea</option>
                            <option value="Eritrea">Eritrea</option>
                            <option value="Estonia">Estonia</option>
                            <option value="Ethiopia">Ethiopia</option>
                            <option value="Falkland Islands (Malvinas)">Falkland Islands (Malvinas)</option>
                            <option value="Faroe Islands">Faroe Islands</option>
                            <option value="Fiji">Fiji</option>
                            <option value="Finland">Finland</option>
                            <option value="France">France</option>
                            <option value="French Guiana">French Guiana</option>
                            <option value="French Polynesia">French Polynesia</option>
                            <option value="French Southern Territories">French Southern Territories</option>
                            <option value="Gabon">Gabon</option>
                            <option value="Gambia">Gambia</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Germany">Germany</option>
                            <option value="Ghana">Ghana</option>
                            <option value="Gibraltar">Gibraltar</option>
                            <option value="Greece">Greece</option>
                            <option value="Greenland">Greenland</option>
                            <option value="Grenada">Grenada</option>
                            <option value="Guadeloupe">Guadeloupe</option>
                            <option value="Guam">Guam</option>
                            <option value="Guatemala">Guatemala</option>
                            <option value="Guernsey">Guernsey</option>
                            <option value="Guinea">Guinea</option>
                            <option value="Guinea-Bissau">Guinea-Bissau</option>
                            <option value="Guyana">Guyana</option>
                            <option value="Haiti">Haiti</option>
                            <option value="Heard Island and McDonald Islands">Heard Island and McDonald Islands</option>
                            <option value="Holy See (Vatican City State)">Holy See (Vatican City State)</option>
                            <option value="Honduras">Honduras</option>
                            <option value="Hong Kong">Hong Kong</option>
                            <option value="Hungary">Hungary</option>
                            <option value="Iceland">Iceland</option>
                            <option value="India">India</option>
                            <option value="Indonesia">Indonesia</option>
                            <option value="Iran, Islamic Republic of">Iran, Islamic Republic of</option>
                            <option value="Iraq">Iraq</option>
                            <option value="Ireland">Ireland</option>
                            <option value="Isle of Man">Isle of Man</option>
                            <option value="Israel">Israel</option>
                            <option value="Italy">Italy</option>
                            <option value="Jamaica">Jamaica</option>
                            <option value="Japan">Japan</option>
                            <option value="Jersey">Jersey</option>
                            <option value="Jordan">Jordan</option>
                            <option value="Kazakhstan">Kazakhstan</option>
                            <option value="Kenya">Kenya</option>
                            <option value="Kiribati">Kiribati</option>
                            <option value="Korea, Democratic People's Republic of">Korea, Democratic People's Republic of</option>
                            <option value="Korea, Republic of">Korea, Republic of</option>
                            <option value="Kuwait">Kuwait</option>
                            <option value="Kyrgyzstan">Kyrgyzstan</option>
                            <option value="Lao People's Democratic Republic">Lao People's Democratic Republic</option>
                            <option value="Latvia">Latvia</option>
                            <option value="Lebanon">Lebanon</option>
                            <option value="Lesotho">Lesotho</option>
                            <option value="Liberia">Liberia</option>
                            <option value="Libyan Arab Jamahiriya">Libyan Arab Jamahiriya</option>
                            <option value="Liechtenstein">Liechtenstein</option>
                            <option value="Lithuania">Lithuania</option>
                            <option value="Luxembourg">Luxembourg</option>
                            <option value="Macao">Macao</option>
                            <option value="Macedonia">Macedonia</option>
                            <option value="Madagascar">Madagascar</option>
                            <option value="Malawi">Malawi</option>
                            <option value="Malaysia">Malaysia</option>
                            <option value="Maldives">Maldives</option>
                            <option value="Mali">Mali</option>
                            <option value="Malta">Malta</option>
                            <option value="Marshall Islands">Marshall Islands</option>
                            <option value="Martinique">Martinique</option>
                            <option value="Mauritania">Mauritania</option>
                            <option value="Mauritius">Mauritius</option>
                            <option value="Mayotte">Mayotte</option>
                            <option value="Mexico">Mexico</option>
                            <option value="Micronesia, Federated States of">Micronesia, Federated States of</option>
                            <option value="Moldova, Republic of">Moldova, Republic of</option>
                            <option value="Monaco">Monaco</option>
                            <option value="Mongolia">Mongolia</option>
                            <option value="Montenegro">Montenegro</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Morocco">Morocco</option>
                            <option value="Mozambique">Mozambique</option>
                            <option value="Myanmar">Myanmar</option>
                            <option value="Namibia">Namibia</option>
                            <option value="Nauru">Nauru</option>
                            <option value="Nepal">Nepal</option>
                            <option value="Netherlands">Netherlands</option>
                            <option value="New Caledonia">New Caledonia</option>
                            <option value="New Zealand">New Zealand</option>
                            <option value="Nicaragua">Nicaragua</option>
                            <option value="Niger">Niger</option>
                            <option value="Nigeria">Nigeria</option>
                            <option value="Niue">Niue</option>
                            <option value="Norfolk Island">Norfolk Island</option>
                            <option value="Northern Mariana Islands">Northern Mariana Islands</option>
                            <option value="Norway">Norway</option>
                            <option value="Oman">Oman</option>
                            <option value="Pakistan">Pakistan</option>
                            <option value="Palau">Palau</option>
                            <option value="Palestinian Territory">Palestinian Territory</option>
                            <option value="Panama">Panama</option>
                            <option value="Papua New Guinea">Papua New Guinea</option>
                            <option value="Paraguay">Paraguay</option>
                            <option value="Peru">Peru</option>
                            <option value="Philippines">Philippines</option>
                            <option value="Pitcairn">Pitcairn</option>
                            <option value="Poland">Poland</option>
                            <option value="Portugal">Portugal</option>
                            <option value="Puerto Rico">Puerto Rico</option>
                            <option value="Qatar">Qatar</option>
                            <option value="Reunion">Reunion</option>
                            <option value="Romania">Romania</option>
                            <option value="Russian Federation">Russian Federation</option>
                            <option value="Rwanda">Rwanda</option>
                            <option value="Saint Barthelemey">Saint Barthelemey</option>
                            <option value="Saint Helena">Saint Helena</option>
                            <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                            <option value="Saint Lucia">Saint Lucia</option>
                            <option value="Saint Martin">Saint Martin</option>
                            <option value="Saint Pierre and Miquelon">Saint Pierre and Miquelon</option>
                            <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
                            <option value="Samoa">Samoa</option>
                            <option value="San Marino">San Marino</option>
                            <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                            <option value="Saudi Arabia">Saudi Arabia</option>
                            <option value="Senegal">Senegal</option>
                            <option value="Serbia">Serbia</option>
                            <option value="Seychelles">Seychelles</option>
                            <option value="Sierra Leone">Sierra Leone</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Sint Maarten">Sint Maarten</option>
                            <option value="Slovakia">Slovakia</option>
                            <option value="Slovenia">Slovenia</option>
                            <option value="Solomon Islands">Solomon Islands</option>
                            <option value="Somalia">Somalia</option>
                            <option value="South Africa">South Africa</option>
                            <option value="South Georgia and the South Sandwich Islands">South Georgia and the South Sandwich Islands</option>
                            <option value="South Sudan">South Sudan</option>
                            <option value="Spain">Spain</option>
                            <option value="Sri Lanka">Sri Lanka</option>
                            <option value="Sudan">Sudan</option>
                            <option value="Suriname">Suriname</option>
                            <option value="Svalbard and Jan Mayen">Svalbard and Jan Mayen</option>
                            <option value="Swaziland">Swaziland</option>
                            <option value="Sweden">Sweden</option>
                            <option value="Switzerland">Switzerland</option>
                            <option value="Syrian Arab Republic">Syrian Arab Republic</option>
                            <option value="Taiwan">Taiwan</option>
                            <option value="Tajikistan">Tajikistan</option>
                            <option value="Tanzania, United Republic of">Tanzania, United Republic of</option>
                            <option value="Thailand">Thailand</option>
                            <option value="Timor-Leste">Timor-Leste</option>
                            <option value="Togo">Togo</option>
                            <option value="Tokelau">Tokelau</option>
                            <option value="Tonga">Tonga</option>
                            <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                            <option value="Tunisia">Tunisia</option>
                            <option value="Turkey">Turkey</option>
                            <option value="Turkmenistan">Turkmenistan</option>
                            <option value="Turks and Caicos Islands">Turks and Caicos Islands</option>
                            <option value="Tuvalu">Tuvalu</option>
                            <option value="Uganda">Uganda</option>
                            <option value="Ukraine">Ukraine</option>
                            <option value="United Arab Emirates">United Arab Emirates</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="USA">United States of America</option>
                            <option value="United States Minor Outlying Islands">United States Minor Outlying Islands</option>
                            <option value="Uruguay">Uruguay</option>
                            <option value="Uzbekistan">Uzbekistan</option>
                            <option value="Vanuatu">Vanuatu</option>
                            <option value="Venezuela">Venezuela</option>
                            <option value="Vietnam">Vietnam</option>
                            <option value="Virgin Islands, British">Virgin Islands, British</option>
                            <option value="Virgin Islands, U.S.">Virgin Islands, U.S.</option>
                            <option value="Wallis and Futuna">Wallis and Futuna</option>
                            <option value="Western Sahara">Western Sahara</option>
                            <option value="Yemen">Yemen</option>
                            <option value="Zambia">Zambia</option>
                            <option value="Zimbabwe">Zimbabwe</option>
                        </select>
                    </div>
                    <div className="col col-md-1">
                        <button type="submit" className="btn btn-primary bg-petronas float-right" onClick={() => { addAnnualLeave(); }}>Save</button>
                    </div>
                </div>     
                : null
                }      

                { !showAnnualLeave ?
                null :
                <>
                <div id="annual-leave-header" className="row bg-grey">
                    <div className="col col-md-3">
                        <p>Date From</p>
                    </div>
                    <div className="col col-md-3">
                        <p>Date To</p>
                    </div>
                    <div className="col col-md-3">
                        <p>Destination</p>
                    </div>
                    <div className="col col-md-2">
                        <p>Duration</p>
                    </div>                    
                    <div className="col col-md-1"></div>
                </div>

                <div className="annual-leave-rows">
                    { teamMemberHolidays != undefined && teamMemberHolidays.length > 0 && teamMemberHolidays.map(item => (
                    <div className="row annual-leave-row" key={item.id}>
                        <div className="col col-md-3">
                            <p>{item.startdate}</p>
                        </div>
                        <div className="col col-md-3">
                            <p>{item.enddate}</p>
                        </div>
                        <div className="col col-md-3 capitalize">
                            <p>{item.destination}</p>
                        </div>
                        <div className="col col-md-2">
                            <p>{item.dates.length} days</p>
                        </div>
                        <div className="col col-md-1 mt-1">
                            <i className="fas fa-times-circle pointer float-right petronas"  onClick={() => { deleteAnnualLeave(item.id); }}></i>
                        </div>
                    </div>
                    ))}
                </div>
                </>
                }
            </section>
        </article> 
    );
    //#endregion
}

export default TeamMemberView;