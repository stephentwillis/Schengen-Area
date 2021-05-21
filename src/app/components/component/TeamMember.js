import React, { useState, useEffect } from 'react';
import reduce from 'lodash/reduce';
import moment from 'moment';

import config from '../../../config';

const TeamMember = ({teamMember, events, schengenRaceEvents, schengenTestEvents, startDate, endDate}) => {

    const [SchengenRaceEvents, setSchengenRaceEvents] = useState({});
    const [SchengenTestEvents, setSchengenTestEvents] = useState({});
    const [SchengenHolidayEvents, setSchengenHolidayEvents] = useState({});

    const [SchengenRaceDates, setSchengenRaceDates] = useState([]);
    const [SchengenTestDates, setSchengenTestDates] = useState([]);
    const [SchengenHolidayDates, setSchengenHolidayDates] = useState([]);

    const [totalDays, setTotalDays] = useState(0);
    const [totalWidth, setTotalWidth] = useState(0);
    
    useEffect(() => {        
        console.log(startDate);
        console.log(endDate);        
    }, []);

    useEffect(() => {
        
        setSchengenRaceEvents(schengenRaceEvents);
        setSchengenTestEvents(schengenTestEvents);
        setSchengenHolidayEvents(teamMember.travel != undefined ? teamMember.travel.filter(x => x.isschengen && moment(x.startdate, 'DD/MM/YYYY').format('YYYY-MM-DD') >= startDate && moment(x.enddate, 'DD/MM/YYYY').format('YYYY-MM-DD') <= endDate) : 0);

    }, [teamMember])

    useEffect(() => {

        let dates = reduce(SchengenRaceEvents, (acc, event) => {
            acc.push(event.dates[teamMember.role]);
            return acc;
        },[]);

        // Lets flatten that array of arrays!
        setSchengenRaceDates([].concat.apply([], dates));
           
    }, [teamMember, startDate, endDate, SchengenRaceEvents])

    useEffect(() => {        

        let dates = reduce(SchengenTestEvents, (acc, event) => {
            acc.push(event.dates[teamMember.role]);
            return acc;
        },[]);

        // Lets flatten that array of arrays!
        setSchengenTestDates([].concat.apply([], dates));
               
    }, [teamMember, startDate, endDate, SchengenTestEvents])

    useEffect(() => {        

        let dates = reduce(SchengenHolidayEvents, (acc, holiday) => {
            acc.push(holiday.dates);
            return acc;
        },[]);

        // Lets flatten that array of arrays!
        setSchengenHolidayDates([].concat.apply([], dates));

    }, [teamMember, startDate, endDate, SchengenHolidayEvents])

    useEffect(() => {

        setTotalDays(SchengenRaceDates.length + SchengenTestDates.length + SchengenHolidayDates.length);

    }, [teamMember, startDate, endDate, SchengenRaceDates, SchengenTestDates, SchengenHolidayDates]);

    useEffect(() => {        
        let limitDivisor = (config.schengenLimits.limit / 100);        
        
        setTotalWidth(totalDays/limitDivisor);

    }, [totalDays])

    return (
        <>
        <div className="team-member row bg-grey mb-3" key={teamMember.email}>
            <div className="col col-md-1 bg-petronas role pt-4">
                { (teamMember.role == 'garage') ? 
                <i className="fas fa-garage"></i>
                : (teamMember.role == 'mechanic') ?
                <i className="fas fa-tools"></i>
                : (teamMember.role == 'engineer') ?
                <i className="fas fa-cogs"></i>
                : (teamMember.role == 'marketing') ?
                <i className="fas fa-megaphone"></i>
                : null
                }
            </div>
            <div className="col col-md-4 name">
                <h5>{teamMember.name + ' ' + teamMember.surname}</h5>&nbsp;
                <span className="capitalize">({teamMember.role})</span>
                <br />
                <a href={'mailto:' + teamMember.email} target="_blank">{teamMember.email}</a>
            </div>
            <div className="col col-md-7 threshold">
                <div className="progress">
                    <div className="progress-bar bg-petronas" role="progressbar" style={{width: totalWidth + '%'}}><strong>{totalDays} days</strong></div>
                </div>
            </div>
        </div>
        </>
    );

}

export default TeamMember