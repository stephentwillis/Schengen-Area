import merge from 'lodash/merge';
import axios from 'axios';

import config from '../../../config';
import schengenEvents from "../../../schengenEvents";

export const getEventData = () => {
    async function getEvents() {
        const events = await axios({
            method: 'get',
            url: config.endpoints[0]
        });
        
        return merge(events.data, schengenEvents);
    }
    getEvents();        
};