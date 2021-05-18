import React, { useState, useEffect, useRef } from 'react';
import merge from 'lodash/merge';
import axios from 'axios';
const CosmosClient = require("@azure/cosmos").CosmosClient;

import config from '../../../config';
import CosmosConfig from "../../../CosmosConfig";

import { getEventData } from '../controllers/eventContoller';
import { getUserData } from '../controllers/teamMemberController';



var moment = require('moment-timezone');

const DashboardView = ({logout}) => {

    // State handling 
    const [events, updateEvents] = useState([]);
    const [allTeamMembers, fillAllTeamMembers] = useState([]);
    const [ukTeamMembers, fillUKTeamMembers] = useState([]); 
    const [nonUKTeamMembers, fillNonUKTeamMembers] = useState([]); 
    const [atRiskTeamMembers, fillAtRiskTeamMembers] = useState([]);

    useEffect(() => {
        fillEvents();
        fillTeamMembers();
    }, [])
    // -- State Handling

    // Methods
    const fillEvents = () => { 
        async function getEvents() {
            const events = await axios({
                method: 'get',
                url: config.endpoints[0]
            });
            
            updateEvents(merge(events.data, schengenEvents));
        }
        getEvents();
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
            const container = database.container(containerId);
    
            const querySpec = {
                query: "SELECT * from c"
            };    
            
            const teamMemberTravels  = await container.items
                .query(querySpec)
                .fetchAll();
            // -- Cosmos DB                
    
            let res = merge(users.data, teamMemberTravels.resources);

            fillAllTeamMembers(res);
            fillUKTeamMembers(res.filter(x => x.nationality == 'UK'));
            fillNonUKTeamMembers(res.filter(x => x.nationality != 'UK'));
        }
        getUsers();  
    }
    // -- Methods

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
            </section>

            <section id="at-risk-team-members" className="mb-5">
                <div className="row">
                    <div className="col ma-m">
                        <h2 className="grey">Team Members at Risk ({atRiskTeamMembers.length})&nbsp;
                        <i className="far fa-question-circle"></i>
                        </h2>
                    </div>
                </div>

                { atRiskTeamMembers.map(item => (
                <div className="team-member row bg-grey mb-3" key={item.email}>
                    <div className="col col-md-1 bg-petronas role pt-4">
                        { (item.role == 'garage') ? 
                        <i className="fas fa-warehouse"></i>
                        : (item.role == 'mechanic') ?
                        <i className="fas fa-wrench"></i>
                        : (item.role == 'engineer') ?
                        <i className="fas fa-cogs"></i>
                        : (item.role == 'marketing') ?
                        <i className="fas fa-award"></i>
                        : null
                        }
                    </div>
                    <div className="col col-md-4 name">
                        <h5>{item.name + ' ' + item.surname}</h5>&nbsp;
                        <span className="capitalize">({item.role})</span>
                        <br />
                        <a href={'mailto:' + item.email} target="_blank">{item.email}</a>
                    </div>
                    <div className="col col-md-6 threshold">
                        <div className="progress">
                            <div className="progress-bar w-25 bg-petronas" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="180"></div>
                        </div>
                    </div>
                    <div className="col col-md-1 toggle">
                        <i className="fas fa-caret-down"></i>
                    </div>
                </div>
                ))}

            </section>            

            <section id="uk-team-members" className="mb-5">
                <div className="row">
                    <div className="col">
                        <h2 className="grey">UK Team Members ({ukTeamMembers.length})</h2>
                    </div>
                </div>

                { ukTeamMembers.map(item => (
                <div className="team-member row bg-grey mb-3" key={item.email}>
                    <div className="col col-md-1 bg-petronas role pt-4">
                        { (item.role == 'garage') ? 
                        <i className="fas fa-warehouse"></i>
                        : (item.role == 'mechanic') ?
                        <i className="fas fa-wrench"></i>
                        : (item.role == 'engineer') ?
                        <i className="fas fa-cogs"></i>
                        : (item.role == 'marketing') ?
                        <i className="fas fa-award"></i>
                        : null
                        }
                    </div>
                    <div className="col col-md-4 name">
                        <h5>{item.name + ' ' + item.surname}</h5>&nbsp;
                        <span className="capitalize">({item.role})</span>
                        <br />
                        <a href={'mailto:' + item.email} target="_blank">{item.email}</a>
                    </div>
                    <div className="col col-md-6 threshold">
                        <div className="progress">
                            <div className="progress-bar w-25 bg-petronas" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="180">45 days</div>
                        </div>
                    </div>
                    <div className="col col-md-1 toggle">
                        <i className="fas fa-caret-down"></i>
                    </div>
                </div>
                ))}

            </section>

            <section id="non-uk-team-members" className="mb-5">
                <div className="row">
                    <div className="col">
                        <h2 className="grey">Non-UK Team Members ({nonUKTeamMembers.length})</h2>
                    </div>
                </div>

                { nonUKTeamMembers.map(item => (
                <div className="team-member row bg-grey mb-3" key={item.email}>
                    <div className="col col-md-1 bg-petronas role pt-4">
                        { (item.role == 'garage') ? 
                        <i className="fas fa-warehouse"></i>
                        : (item.role == 'mechanic') ?
                        <i className="fas fa-wrench"></i>
                        : (item.role == 'engineer') ?
                        <i className="fas fa-cogs"></i>
                        : (item.role == 'marketing') ?
                        <i className="fas fa-award"></i>
                        : null
                        }
                    </div>
                    <div className="col col-md-4 name">
                        <h5>{item.name + ' ' + item.surname}</h5>&nbsp;
                        <span className="capitalize">({item.role})</span>
                        <br />
                        <a href={'mailto:' + item.email} target="_blank">{item.email}</a>
                    </div>
                    <div className="col col-md-6 threshold">
                        <div className="progress">
                            <div className="progress-bar w-25 bg-petronas" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="180"></div>
                        </div>
                    </div>
                    <div className="col col-md-1 toggle">
                        <i className="fas fa-caret-down"></i>
                    </div>
                </div>
                ))}

            </section>
        </article>
    );
}

export default DashboardView;