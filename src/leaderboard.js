const axios = require('axios');
const BASE_URL = 'https://www.speedrun.com/api/v2/GetGameLeaderboard2';

async function getLeaderBoard(token) {
    if (!token) throw new Error('Token Gaada');
    const response = await axios.get(`${BASE_URL}`,{
        params:{
            _r : token
        }
    });

    return response.data;
}

module.exports = {
    getLeaderBoard
}