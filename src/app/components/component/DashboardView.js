//#region Import Libraries
import React, { useState, useEffect } from 'react';
import merge from 'lodash/merge';
import reduce from 'lodash/reduce';
import orderBy from 'lodash/orderBy';
import DatePicker from 'react-date-picker'
import moment from 'moment';
import axios from 'axios';
const CosmosClient = require("@azure/cosmos").CosmosClient;

import EventRow from './EventRow';
import EventCard from './EventCard';

import config from '../../../config';
import CosmosConfig from "../../../CosmosConfig";
import schengenEvents from "../../../data/schengenEvents";
//#endregion

const DashboardView = ({logout}) => {

    // #region Variables
    let initialEvent = {
        eventCode: "",
        venue: "",
        date: moment().format('DD/MM/YYYY').toString(),
        duration: 0,
        type: ""
    }

    const Now = moment();
    //#endregion

    // #region State handling 
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [events, updateEvents] = useState([]);
    const [additionalEvents, updateAdditionalEvents] = useState([]);
    const [newEvent, updateNewEvent] = useState(initialEvent);
    const [next3Events, updateNext3Events] = useState([]);
    const [showFullSchedule, toggleFullScheduleState] = useState(false);

    const [ukTeamMembers, fillUKTeamMembers] = useState([]); 
    
    const [showForm, toggleFormState] = useState(false);
    const [showUpcomingEvents, toggleUpcomingEventsState] = useState(true);
    const [showAdditionalEvents, toggleAdditionalEventsState] = useState(false);
    const [showUKTeamMembers, toggleUKTeamMembersState] = useState(false);

    const [updateAllEvents, setUpdateEventStatus] = useState(true);

    useEffect(() => {        
        fillTeamMembers();
    }, []);
    
    useEffect(() => {
        setDefaultDates();
        fillEvents();

    }, [ukTeamMembers])

    useEffect(() => {
        fillEvents();
    },[ukTeamMembers, startDate, endDate])

    useEffect(() => {        
        if (updateAllEvents) {
            mutateEvents();
        }
        setUpdateEventStatus(false);

        filterEvents();
    }, [events]);

    useEffect(() => {
        
        for (let i = 0; i < ukTeamMembers.length; i++) {            
            
            let raceDates = reduce(events.filter(x => x.type.toLowerCase() == 'race' && x.orderDate >= startDate && x.orderDate <= endDate && x.isSchengen), (acc, event) => {
                acc.push(event.dates[ukTeamMembers[i].role]);
                return acc;
            },[]);

            let testDates = reduce(events.filter(x => x.type.toLowerCase() == 'test' && x.orderDate >= startDate && x.orderDate <= endDate && x.isSchengen), (acc, event) => {                
                acc.push(event.dates[ukTeamMembers[i].role]);
                return acc;
            },[]);

            let holidays = ukTeamMembers[i].travel != undefined ? ukTeamMembers[i].travel.filter(x => x.isschengen && moment(x.startdate, 'DD/MM/YYYY').format('YYYY-MM-DD') >= startDate && moment(x.enddate, 'DD/MM/YYYY').format('YYYY-MM-DD') <= endDate) : 0;

            let total = 0;
            for (let j = 0; j < holidays.length; j++) {
                total = total + holidays[j].totaldays;
            }           

            let totalSchengenRaceDates = [].concat.apply([], raceDates).length;
            let totalSchengenTestDates = [].concat.apply([], testDates).length;
            let totalSchengenHolidayDates = total;

            ukTeamMembers[i].totalSchengenDays = totalSchengenRaceDates + totalSchengenTestDates + totalSchengenHolidayDates;

            let limitDivisor = (config.schengenLimits.limit / 100); 
            ukTeamMembers[i].width = (totalSchengenRaceDates + totalSchengenTestDates + totalSchengenHolidayDates)/limitDivisor;

            if (ukTeamMembers[i].name = 'Glady' && ukTeamMembers[i].surname == 'Powell' ) {
                console.log(ukTeamMembers[i]);
            }
        }
        
    },[ukTeamMembers, startDate])
    //#endregion

    //#region Event Handlers
    const change = (e) =>  { 
        updateNewEvent({
            ...newEvent,
            [e.target.name]: e.target.value.trim() 
        });
    }

    const changeDate = (name, date) =>  { 
        updateNewEvent({
            ...newEvent,
            [name]: moment(date).format('DD/MM/YYYY').toString()
        });
    }

    const changeDateRange = (name, date) =>  { 
        if (date != null) {
            let tempDate = moment(date)

            // Account for the last day being a whole day!
            if (name == 'endDate') {
                tempDate.add(1, 'days');
            }

            setUpdateEventStatus(true);
            setStartDate(tempDate.format('YYYY-MM-DD').toString());
            setEndDate(tempDate.add(config.schengenLimits.period, 'days').format('YYYY-MM-DD').toString());
        } else {
            setDefaultDates();
        }
    }

    const toggleForm = () => {
        toggleFormState(!showForm);
    }

    const toggleUpcomingEvents = () => {
        toggleUpcomingEventsState(!showUpcomingEvents);
    }

    const toggleFullSchedule = () => {
        toggleFullScheduleState(!showFullSchedule);
    }

    const toggleAdditionalEvents = () => {
        toggleAdditionalEventsState(!showAdditionalEvents);
    }

    const toggleUKTeamMembers = () => {
        toggleUKTeamMembersState(!showUKTeamMembers);
    }
    //#endregion

    //#region Methods
    const setDefaultDates = () => {
        setStartDate(Now.format('YYYY-MM-DD').toString());
        setEndDate(Now.add(config.schengenLimits.period, 'days').format('YYYY-MM-DD').toString());        
    }

    const fillEvents = () => { 
        async function getEvents() {
            const events = await axios({
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
            
            let mergedEvents = merge(events.data, res.resources);

            setUpdateEventStatus(true);
            updateEvents(mergedEvents);
        }
        getEvents();
    }

    const mutateEvents = () => {
        // I'm sure there is a more elegant way of doing this!
        // Munging on read will have performance costs.
        for (let i = 0; i < events.length; i++) {
            let index = schengenEvents.findIndex(x => x.venue === events[i].venue);

            events[i].title = schengenEvents[index].title;
            events[i].circuit = schengenEvents[index].circuit;
            events[i].isSchengen = schengenEvents[index].isSchengen;
            events[i].orderDate = moment(events[i].date, 'DD-MM-YYYY').format('YYYY-MM-DD');           

            events[i].RaceDayOne = moment(events[i].date, 'DD/MM/YYYY').subtract(2, 'days').format('YYYY-MM-DD');
            events[i].RaceDayTwo = moment(events[i].date, 'DD/MM/YYYY').subtract(1, 'days').format('YYYY-MM-DD');

            if (events[i].type.toLowerCase() == 'test') {
                events[i].TestTo = moment(events[i].date, 'DD/MM/YYYY').add(events[i].duration, 'days').format('YYYY-MM-DD');
            }

            // Build Array of event dates and push into event object
            // hate nested loops            
            let garage = [];
            let mechanic = [];
            let engineer = [];
            let marketing = [];

            let from = moment(events[i].orderDate, 'YYYY-MM-DD');
            let to = moment(events[i].orderDate, 'YYYY-MM-DD');


            // Could refactor this into another loop and programmatically look up the role and date offsets
            // but I really hate loops in loops in loops - Big O (asymtotic complexity)

            // Race      
            if (events[i].type.toLowerCase() == 'race') {      
                
                // Garage
                from.subtract(config.eventDays.race.garage[0], 'days');
                to.add(config.eventDays.race.garage[1], 'days');

                while (from <= to) {
                    garage.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }

                // Mechanic
                from = moment(events[i].orderDate);
                to = moment(events[i].orderDate);
                from.subtract(config.eventDays.race.mechanic[0], 'days');
                to.add(config.eventDays.race.mechanic[1], 'days');

                while (from <= to) {
                    mechanic.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }

                // Engineer
                from = moment(events[i].orderDate);
                to = moment(events[i].orderDate);
                from.subtract(config.eventDays.race.engineer[0], 'days');
                to.add(config.eventDays.race.engineer[1], 'days');

                while (from <= to) {
                    engineer.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }                

                // Marketing
                from = moment(events[i].orderDate);
                to = moment(events[i].orderDate);
                from.subtract(config.eventDays.race.marketing[0], 'days');
                to.add(config.eventDays.race.marketing[1], 'days');

                while (from <= to) {
                    marketing.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }
            } else {
                to = moment(events[i].TestTo);

                // Garage
                from.subtract(config.eventDays.test.garage[0], 'days');
                to.add(config.eventDays.test.garage[1], 'days');

                while (from <= to) {
                    garage.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }

                // Mechanic
                from = moment(events[i].orderDate);
                to = moment(events[i].TestTo);
                from.subtract(config.eventDays.test.mechanic[0], 'days');
                to.add(config.eventDays.test.mechanic[1], 'days');

                while (from <= to) {
                    mechanic.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }

                // Engineer
                from = moment(events[i].orderDate);
                to = moment(events[i].TestTo);
                from.subtract(config.eventDays.test.engineer[0], 'days');
                to.add(config.eventDays.test.engineer[1], 'days');

                while (from <= to) {
                    engineer.push(from.format('YYYY-MM-DD'));
                    from = from.add(1, 'days');
                }                

                // Marketing
                from = moment(events[i].orderDate);
                to = moment(events[i].TestTo);
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

            events[i].dates = enumeratedDates;

            // console.log(events[i]);
        }   

        // Update events object but not updating flag otherwise we'll end up in a infinite loop!
        updateEvents(orderBy(events.filter(x => x.orderDate >= startDate), 'orderDate', 'asc'));  
    }

    const filterEvents = () => {
        updateNext3Events(events.slice(0, 3));
    }

    const fillTeamMembers = () => { 
        async function getUsers() {
            const users = await axios({
                method: 'get',
                url: config.endpoints[1]
            });
    
            // Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
    
            const client = new CosmosClient({ endpoint, key });
    
            const database = client.database(databaseId);
            const container = database.container("User");
    
            const querySpec = {
                query: "SELECT * from c"
            };    
            
            const teamMemberTravels  = await container.items
                .query(querySpec)
                .fetchAll();
            // -- Cosmos DB                
    
            let res = merge(users.data, teamMemberTravels.resources);

            fillUKTeamMembers(res.filter(x => x.nationality == 'UK'));
        }
        getUsers();
    }

    const addEvent = () => {
        async function add() {            
            let dateParts = newEvent.date.split('/');
            let code;

            if (newEvent.type.toLowerCase() == 'race') {
                code = dateParts[1] + '_' + dateParts[0] + newEvent.venue.substring(0,3);
            } else {
                code = newEvent.venue.substring(0,3) + dateParts[1] + '_' + dateParts[0];
            }

            let eventObj = {
                eventCode: code,
                venue: newEvent.venue,
                date: newEvent.date,
                duration: parseInt(newEvent.duration),
                type: newEvent.type
            }

            // update Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
        
            const client = new CosmosClient({ endpoint, key });

            const database = client.database(databaseId);
            const container = database.container('AdditionalEvent');

            const updatedAdditionalEvents = await container
                .items
                .create(eventObj);

            setUpdateStatus(true);
            updateAdditionalEvents(updatedAdditionalEvents);
        }
        add();
    }

    const deleteEvent = (id, eventCode) => {   
        async function del() {
            // update Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
        
            const client = new CosmosClient({ endpoint, key });

            const database = client.database(databaseId);
            const container = database.container('AdditionalEvent');

            const updatedAdditionalEvents = await container
                .item(id, eventCode)
                .delete();

            setUpdateStatus(true);
            updateAdditionalEvents(updatedAdditionalEvents);
        }
        del();        
    }
    //#endregion

    //#region Render
    return (
        <article id="dashboard" className="container">
            <section id="header">
                <div className="row">
                    <div className="col">
                        <h1 className="petronas">Dashboard</h1>
                    </div>

                    <div className="col">
                        <button type="submit" className="btn btn-primary bg-petronas float-right" onClick={(e) => { logout(); }}>Log Out</button>
                    </div>
                </div>
            </section>
            
            <section id="team-schedule" className="mb-5">
                <div className="row">
                    <div className="col">
                        <h2 className="grey">Team Schedule</h2> 
                    </div>
                </div>

                <div className="row">
                    <div className="col col-md-2">
                        { !showUpcomingEvents ?
                        <i className="fas fa-angle-right float-right fs-15 petronas pointer" onClick={() => { toggleUpcomingEvents(); }}></i>
                        :
                        <i className="fas fa-angle-down float-right fs-15 petronas pointer" onClick={() => { toggleUpcomingEvents(); }}></i>
                        }
                        <h5 className="grey">Next 3 Events</h5> 
                    </div>                    
                </div>
                { !showUpcomingEvents ?
                null
                :
                <>
                <div className="row mb-5">
                    <div className="col card-deck">                    
                    { next3Events != undefined && next3Events.length > 0 && next3Events.map(item => (
                        <EventCard event={item} />
                    ))}
                    </div>                    
                </div>
                <div className="row">
                    <div className="col col-md-3">
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
                    events != undefined && events.length > 0 && events.slice(4, events.length).map(item => (
                    <EventRow event={item} />
                ))}
                </>
                }
                
                <div className="additional-events mt-3">
                    <div className="row">
                        <div className="col col-md-2">
                            { !showAdditionalEvents ?
                            <i className="fas fa-angle-right float-right fs-15 petronas pointer" onClick={() => { toggleAdditionalEvents(); }}></i>
                            :
                            <i className="fas fa-angle-down float-right fs-15 petronas pointer" onClick={() => { toggleAdditionalEvents(); }}></i>
                            }
                            <h5 className="grey">Additional Events</h5>
                        </div>
                    </div>

                    { !showAdditionalEvents ?
                        null
                    :
                    !showForm ?
                    <div className="row">
                        <div className="col col-md-2 add-event" onClick={() => { toggleForm(); }}>
                            <i className="petronas fas fa-plus-circle pointer float-left"></i>
                            <h6>Add New Event</h6>
                        </div>             
                    </div>
                    : 
                    <div className="row">
                        <div className="col col-md-2 add-event" onClick={() => { toggleForm(); }}>
                            <i className="petronas fas fa-times-circle pointer float-left"></i>
                            <h6>Hide</h6>
                        </div>             
                    </div>
                    }
                    
                    { !showAdditionalEvents ?
                        null
                    :
                    showForm ? 
                    <div id="event-form" className="row pb-2">
                        <div className="col col-md-3">
                            <select name="venue" className="form-control" onChange={(e) => { change(e) }}>
                                <option selected>Venue...</option>
                                <option value="Abu Dhabi">Abu Dhabi</option>
                                <option value="Austria">Austria</option>
                                <option value="Bahrain">Bahrain</option>
                                <option value="Baku">Baku</option>
                                <option value="Barcelona">Barcelona</option>
                                <option value="Belgium">Belgium</option>
                                <option value="Budapest">Budapest</option>
                                <option value="Brazil">Brazil</option>
                                <option value="Canada">Canada</option>
                                <option value="France">France</option>
                                <option value="Imola">Imola</option>
                                <option value="Jedda">Jedda</option>
                                <option value="Monaco">Monaco</option>
                                <option value="Monza">Monza</option>
                                <option value="Melbourne">Melbourne</option>
                                <option value="Mexico">Mexico</option>
                                <option value="Mugello">Mugello</option>
                                <option value="Portimao">Portimao</option>
                                <option value="Portugal">Portugal</option>
                                <option value="Shanghai">Shanghai</option>
                                <option value="Silverstone">Silverstone</option>
                                <option value="Singapore">Singapore</option>
                                <option value="Sochi">Sochi</option>
                                <option value="Suzuka">Suzuka</option>
                                <option value="USA">USA</option>
                                <option value="Zandvoort">Zandvoort</option>
                            </select>
                        </div>
                        <div className="col col-md-3">
                            <DatePicker className="form-control datepicker" format="dd/MM/yyyy" value={moment(newEvent.date, 'DD/MM/YYYY').toDate()} onChange={(e) => { changeDate('date', e) }} />
                        </div>                    
                        <div className="col col-md-3">
                            <select name="type" className="form-control" onChange={(e) => { change(e) }}>
                                <option selected>Event type...</option>
                                <option value="Race">Race</option>
                                <option value="Test">Test</option>
                            </select>
                        </div>
                        <div className="col col-md-2">
                            <select name="duration" className="form-control" onChange={(e) => { change(e) }}>
                                <option selected>Event duration...</option>
                                <option value="1">1 day</option>
                                <option value="2">2 days</option>
                                <option value="3">3 days</option>
                                <option value="4">4 days</option>
                                <option value="5">5 days</option>
                                <option value="6">6 days</option>
                            </select>
                        </div>
                        <div className="col col-md-1">
                            <button type="submit" className="btn btn-primary bg-petronas float-right" onClick={() => { addEvent(); }}>Save</button>
                        </div>
                    </div>     
                    : null 
                    }

                    { !showAdditionalEvents ?
                        null
                    :
                    <>
                    <div id="additional-events-header" className="row bg-grey">
                        <div className="col col-md-3">
                            <p>Venue</p>
                        </div>
                        <div className="col col-md-3">
                            <p>Date</p>
                        </div>
                        <div className="col col-md-3">
                            <p>Type</p>
                        </div>
                        <div className="col col-md-2">
                            <p>Duration</p>
                        </div>                    
                        <div className="col col-md-1"></div>
                    </div>

                    <div className="additional-event-rows">
                        { additionalEvents != undefined && additionalEvents.length > 0 && additionalEvents.map(item => (
                        <div className="row additional-event-row" key={item.id}>
                            <div className="col col-md-3">
                                <p>{item.venue}</p>
                            </div>
                            <div className="col col-md-3">
                                <p>{item.date}</p>
                            </div>
                            <div className="col col-md-3 capitalize">
                                <p>{item.type}</p>
                            </div>
                            <div className="col col-md-2">
                                <p>{item.duration} days</p>
                            </div>
                            <div className="col col-md-1 mt-1">
                                <i className="fas fa-times-circle pointer float-right petronas"  onClick={() => { deleteEvent(item.id, item.eventCode); }}></i>
                            </div>
                        </div>
                        ))}
                    </div>
                    </>
                    }
                </div>
            </section>

            <section id="uk-team-members" className="mb-5">
                <div className="row">
                    <div className="col col-md-4">
                        { !showUKTeamMembers ?
                            <i className="fas fa-angle-right float-right fs-15 mt-2 petronas pointer" onClick={() => { toggleUKTeamMembers(); }}></i>
                            :
                            <i className="fas fa-angle-down float-right fs-15 mt-2 petronas pointer" onClick={() => { toggleUKTeamMembers(); }}></i>
                        }
                        <h2 className="grey">UK Team Members ({ukTeamMembers.length})</h2>
                    </div>
                </div>

                { !showUKTeamMembers ?
                null :
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
                }

                { !showUKTeamMembers ?
                null
                :                
                ukTeamMembers.map(item => (
                    <>
                    <div className="team-member row bg-grey mb-3" key={item.email}>
                        <div className="col col-md-1 bg-petronas role pt-4">
                            { (item.role == 'garage') ? 
                            <i className="fas fa-garage"></i>
                            : (item.role == 'mechanic') ?
                            <i className="fas fa-tools"></i>
                            : (item.role == 'engineer') ?
                            <i className="fas fa-cogs"></i>
                            : (item.role == 'marketing') ?
                            <i className="fas fa-megaphone"></i>
                            : null
                            }
                        </div>
                        <div className="col col-md-4 name">
                            <h5>{item.name + ' ' + item.surname}</h5>&nbsp;
                            <span className="capitalize">({item.role})</span>
                            <br />
                            <a href={'mailto:' + item.email} target="_blank">{item.email}</a>
                        </div>
                        <div className="col col-md-7 threshold">
                            <div className="progress">
                                <div className="progress-bar bg-petronas" role="progressbar" style={{width: item.width + '%'}}><strong>{item.totalSchengenDays} days</strong></div>
                            </div>
                        </div>
                    </div>
                    </>
                ))}

            </section>
        </article>
    );
    //#endregion
}

export default DashboardView;