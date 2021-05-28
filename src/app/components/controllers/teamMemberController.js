import merge from 'lodash/merge';
import axios from 'axios';
const CosmosClient = require("@azure/cosmos").CosmosClient;

import config from '../../../config';
import CosmosConfig from "../../../CosmosConfig";

export const getUserData = () => {  
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
        
        const teamMemberTravels = await container.items
            .query(querySpec)
            .fetchAll();
        // -- Cosmos DB                

        return merge(users.data, teamMemberTravels.resources);
    }
    getUsers();
};