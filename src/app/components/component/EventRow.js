import React from 'react';
import moment from 'moment';

import config from '../../../config';

const EventRow = ({ event }) => {

    return (
        <>        
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

                {event.type.toLowerCase() == 'race' ?
                <i className="fal fa-flag-checkered ml-2"></i>
                : null }
            </div>
            <div className="col col-md-4">
                <span>
                    <strong>From:</strong> {event.type.toLowerCase() == 'race' ? moment(event.orderDate).subtract(event.duration).format('DD/MM/YYYY') : moment(event.orderDate).format('DD/MM/YYYY') }
                </span>
                <i className="fal fa-long-arrow-right ml-4 mr-4"></i>
                <span>
                    <strong>To:</strong> {event.type.toLowerCase() == 'test' ? moment(event.orderDate).add(event.duration).format('DD/MM/YYYY') : moment(event.orderDate).format('DD/MM/YYYY') }
                </span>
            </div>
        </>
    );
}

export default EventRow;