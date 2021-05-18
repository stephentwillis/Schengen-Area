import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../../../config';

import TeamMemberView from '../component/TeamMemberView';
import DashboardView from '../component/DashboardView';

const AppContainer = () => {

    // Objects
    const isMounted = useRef(false);

    let travelDept = config.credentials[0];

    let initialCredentials = {
        email: "",
        password: ""
    };

    let initialTeamMember = { 
        name: "", 
        surname: "", 
        role:"", 
        nationality: "", 
        email: ""
    };
    // -- Objects


    // State handling
    const [credentials, updateCredentials] = useState(initialCredentials);
    const [isLoggedIn, updateLoginState] = useState(false);
    const [authenticated, authentication] = useState(true);
    const [isTeamMember, updateTeamMemberState] = useState(false);    
    const [teamMember, updateTeamMember] = useState(initialTeamMember);

    useEffect(() => {
        const loggedInUser = localStorage.getItem("user");

        if (loggedInUser) {
            const foundUser = JSON.parse(loggedInUser);
            updateTeamMember(foundUser);

            updateLoginState(true);

            if (foundUser.name != travelDept.username) {
                updateTeamMemberState(true);
            }
        }        
    }, []);

    useEffect(() => {
        if (isMounted.current) {
            if (credentials.email == travelDept.username && credentials.password == travelDept.password) {            
                updateLoginState(true);

                localStorage.setItem('user', JSON.stringify(teamMember));
            } else if (credentials.email == teamMember.email && credentials.password == (teamMember.name + '.' + teamMember.surname)) {      
                
                // Login and set cookie
                updateLoginState(true);
                updateTeamMemberState(true);

                localStorage.setItem('user', JSON.stringify(teamMember));
            } else {
                // authentication failed
                authentication(false);
            }
        } else {           
            isMounted.current = true;
        }
    }, [teamMember])
    // -- State Handling


    // Event Handlers
    const change = (e) =>  { 
        updateCredentials({
            ...credentials,
            [e.target.name]: e.target.value.trim() 
        });
    }

    const submit = (e) => {
        e.preventDefault();

        async function getUsers() {
            const users = await axios({
                method: 'get',
                url: config.endpoints[1]
            });            

            login(users, credentials.email);
        }
        getUsers();
    }
    // -- Event Handlers

    // Methods
    const login = (users, email) => {   
        if (users.data) {
            loginUser(users, email);
        }
    }

    const loginUser = (users, email) => {
        let user = users.data.filter(x => x.email == email)[0];
        
        if (user != undefined) {
            updateTeamMember({
                ...teamMember,
                name: user.name,
                surname: user.surname,
                role: user.role,
                nationality: user.nationality,
                email: user.email
            });
        }

        if (credentials.email == travelDept.username && credentials.password == travelDept.password) {            
            updateTeamMember({
                ...teamMember,
                name: travelDept.username
            });
        }
    }

    const logout = () => {
        localStorage.clear();
        window.location.reload();
    }
    // -- Methods

    return (
        <>
        {
            // Views
            (isLoggedIn) ? 
                (isTeamMember) ?
                    <TeamMemberView logout={logout} />
                    : 
                    <DashboardView logout={logout} />
                :
                <section id="login">

                {
                    (!authenticated) ?
                    <div className="row">
                        <div className="col-md-4 offset-md-4 alert alert-danger" role="alert">
                            Login failed
                        </div>
                    </div> 
                    : null
                }

                <div className="row">
                    <form className="col-md-4 offset-md-4">
                        <div className="form-group">
                        <input name="email" type="email" className="form-control form-control-lg" placeholder="Email Address" onChange={(e) => { change(e) }} />
                        </div>
                        <div className="form-group">
                        <input name="password" type="password" className="form-control form-control-lg" placeholder="Password" onChange={(e) => { change(e) }} />
                        </div>
                        <button type="submit" className="btn btn-primary bg-petronas float-right" onClick={(e) => { submit(e); }}>Login</button>
                    </form>
                </div>
            </section>
        }
        </>
    );

}

export default AppContainer;