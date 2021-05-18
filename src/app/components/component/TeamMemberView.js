import React, { useState, useEffect, useRef } from 'react';
import merge from 'lodash/merge';
import axios from 'axios';
const CosmosClient = require("@azure/cosmos").CosmosClient;

import config from '../../../config';
import CosmosConfig from "../../../CosmosConfig";

import schengenEvents from "../../../schengenEvents";
import schengenArea from "../../../schengenArea";

var moment = require('moment-timezone');

const TeamMemberView = ({logout}) => {

    let initialAnnualLeave = {
        id: 0,
        startdate: "",
        enddate: "",
        destination: "",
        totaldays: 0,
        isschengen: false
    };

    // State handling 
    const [newAnnualLeave, updateNewAnnualLeave] = useState(initialAnnualLeave);
    const [teamMember, updateTeamMember] = useState([]);
    const [showForm, toggleForm] = useState(false);
    const [update, setUpdateStatus] = useState(false);

    useEffect(() => {
        fillTeamMember();
    }, []);
    
    useEffect(() => {
        if (update) {
            fillTeamMember();
        }
        setUpdateStatus(false);
    }, [teamMember])
    // -- State Handling

    // Methods
    const fillTeamMember = () => { 
        async function getUser() {
    
            // Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
    
            const client = new CosmosClient({ endpoint, key });
    
            const database = client.database(databaseId);
            const container = database.container(containerId);
    
            const querySpec = {
                query: "SELECT * from c"
            };    
            
            const teamMemberTravels = await container.items
                .query(querySpec)
                .fetchAll();
            // -- Cosmos DB

            let user = JSON.parse(localStorage.getItem("user"));
    
            updateTeamMember(merge(user, teamMemberTravels.resources.filter(x => x.email == user.email)[0]));
        }
        getUser();  
    }

// Event Handlers
    const change = (e) =>  { 
        updateNewAnnualLeave({
            ...newAnnualLeave,
            [e.target.name]: e.target.value.trim() 
        });
    }

    const toggle = () => {
        toggleForm(!showForm);
    }

    const addAnnualLeave = () => {
        async function update() {
            newAnnualLeave.id = teamMember.travel.length;

            teamMember.travel.push(newAnnualLeave);

            // update Cosmos DB
            const { endpoint, key, databaseId, containerId } = CosmosConfig;
        
            const client = new CosmosClient({ endpoint, key });

            const database = client.database(databaseId);
            const container = database.container(containerId);

            const updatedTeamMember = await container
                .item(teamMember.id, teamMember.email)
                .replace(teamMember);

            setUpdateStatus(true);
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
            const container = database.container(containerId);

            const updatedTeamMember = await container
                .item(teamMember.id, teamMember.email)
                .replace(teamMember);

            setUpdateStatus(true);
            updateTeamMember(updatedTeamMember);
        }
        update();        
    }
    // -- Methods

    return (
        <article id="team-member" className="container">
            <section id="header">
                <div className="row">
                    <div className="col">
                        <h1 className="petronas">My Account</h1> 
                        <p>
                            <strong>Name: </strong> {teamMember.name + ' ' + teamMember.surname}
                            <br />
                            <strong>Email: </strong> {teamMember.email}
                            <br />
                            <strong>Nationality: </strong> {teamMember.nationality}
                            <br />
                            <strong>Role: </strong> <span className="capitalize">{teamMember.role}</span>
                        </p>   
                    </div>
                    <div className="col">
                        <button type="submit" className="btn btn-primary bg-petronas float-right" onClick={(e) => { logout(); }}>Log Out</button>
                    </div>
                </div>
            </section>

            <section id="my-schedule">
                <div className="row">
                    <div className="col">
                        <h2 className="grey">My Schedule</h2> 
                    </div>
                </div>
            </section>

            <section id="annual-leave">
                <div className="row">
                    <div className="col">
                        <h2 className="grey">My Annual Leave</h2> 
                    </div>
                </div>

                { !showForm ?
                <div className="row">
                    <div className="col col-md-2 add-annual-leave" onClick={() => { toggle(); }}>
                        <i className="petronas fas fa-plus-circle float-left"></i>
                        <h6>Add Annual Leave</h6>
                    </div>             
                </div>
                : 
                <div className="row">
                    <div className="col col-md-2 add-annual-leave" onClick={() => { toggle(); }}>
                        <i className="petronas fas fa-times-circle float-left"></i>
                        <h6>Hide</h6>
                    </div>             
                </div>
                }
                
                { showForm ? 
                <div id="annual-leave-form" className="row">
                    <div className="col col-md-4">
                        <input name="startdate" type="email" className="form-control" placeholder="Date From" onChange={(e) => { change(e) }} />
                    </div>
                    <div className="col col-md-4">
                        <input name="enddate" type="email" className="form-control" placeholder="Date To" onChange={(e) => { change(e) }} />
                    </div>
                    <div className="col col-md-3">
                        <select name="destination" className="form-control" onChange={(e) => { change(e) }}>
                            <option selected>Please choose a destination...</option>
                            <option value="monaco">Monaco</option>
                        </select>
                    </div>
                    <div className="col col-md-1">
                        <button type="submit" className="btn btn-primary bg-petronas float-right" onClick={() => { addAnnualLeave(); }}>Save</button>
                    </div>
                </div>     
                : null 
                }      

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
                    { teamMember.travel != undefined && teamMember.travel.length > 0 && teamMember.travel.map(item => (
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
                            <p>{item.totaldays} days</p>
                        </div>
                        <div className="col col-md-1 mt-1">
                            <i className="fas fa-times-circle float-right petronas"  onClick={() => { deleteAnnualLeave(item.id); }}></i>
                        </div>
                    </div>
                    ))}
                </div>

            </section>
        </article> 
    );
}

export default TeamMemberView;