import React from 'react';
import config from '../../../config';

const EventCard = ({ event, teamMember }) => {

    return (
        <>
        <div className="card" key={event.id}>
            <div className="card-header petronas">
                <h4>
                    {event.title != undefined && event.title.length > 0 ? 
                        event.type.toLowerCase() == 'race' ? 
                            event.title.indexOf('Grand Prix') < 0 ? 
                                (event.title + ' Grand Prix') 
                            : event.title 
                        : event.title.replace('Grand Prix', '') + ' Test'
                    : event.type.toLowerCase() == 'race' ?                                         
                        (event.venue + ' Grand Prix') 
                        : event.venue + ' Test'} 
                    {event.type.toLowerCase() == 'race' ? 
                        <i className="fal fa-flag-checkered float-right"></i>
                        : null
                    }
                    </h4>
            </div>
            <div className="card-body">                                
                <div className="card-text">
                    <strong>Circuit:</strong> {event.circuit}
                </div>
                <div className="card-text">                    
                    { event.type.toLowerCase() == 'race' ?
                    <>
                    <strong>FP1 & FP2:</strong> {event.RaceDayOne}
                    <br />
                    <strong>FP3 & Qualifying:</strong> {event.RaceDayTwo}
                    <br />
                    <strong>Race:</strong> {event.date}
                    </>
                    : 
                    <>
                    <span>
                        <strong>From:</strong> {event.date}
                    </span>
                    <i className="fal fa-long-arrow-right ml-4"></i>
                    <span className="float-right">
                        <strong>To:</strong> {event.TestTo}
                    </span>
                    </>
                    }
                </div>
            </div>
        </div>
        </>
    );

}

export default EventCard;