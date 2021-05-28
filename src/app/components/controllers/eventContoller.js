import merge from 'lodash/merge';
import axios from 'axios';
const CosmosClient = require("@azure/cosmos").CosmosClient;

import config from '../../../config';
import CosmosConfig from "../../../CosmosConfig";

export const getEventData = () => {
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
        // -- Cosmos DB 
        
        return merge(apiEvents.data, res.resources);
    }
    getEvents();       
};