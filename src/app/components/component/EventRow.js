import React from 'react';
import moment from 'moment';

import config from '../../../config';

const EventRow = ({ event }) => {

    return (
        <>
        <div className="row full-schedule-row" key={event.id}>
            <div className="col col-md-5">
                {event.title != undefined && event.title.length > 0 ? 
                    event.type.toLowerCase() == 'race' ? 
                        event.title.indexOf('Grand Prix') < 0 ? 
                            (event.title + ' Grand Prix, ' + event.circuit)
                        : event.title + ', ' + event.circuit 
                    : event.title.replace('Grand Prix', '') + ' Test, ' + event.circuit
                : event.type.toLowerCase() == 'race' ?                                         
                    (event.venue + ' Grand Prix, ' + event.circuit) 
                    : event.venue + ' Test, ' + event.circuit} 
            </div>
            <div className="col col-md-4">
                <span>
                    <strong>From:</strong> {event.type.toLowerCase() == 'race' ? moment(event.orderDate).subtract(event.duration).format('DD/MM/YYYY') : event.orderDate }
                </span>
                <i className="fal fa-long-arrow-right ml-4 mr-4"></i>
                <span>
                    <strong>To:</strong> {event.type.toLowerCase() == 'test' ? moment(event.orderDate).add(event.duration).format('DD/MM/YYYY') : event.orderDate }
                </span>
            </div>
            <div className="col col-md-1">
                {event.type.toLowerCase() == 'race' ?
                <i className="fal fa-flag-checkered"></i>
                : null }
            </div>
        </div>
        </>
    );
}

export default EventRow;