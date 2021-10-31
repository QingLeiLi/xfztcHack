const axios = require('axios');
const getQuestion = require('./question');

const commonParams = {
    orgcode: 'zjdcgfadmin'
    token: 'yfltcu1628489680',
    activityId: 13526,
    chooseRoomId: '',
};

function request({
    path,
    params: {},
} = {}){
    const normalizedParams = {
        ...commonParams,
        r: path,
        t: parseInt(Date.now() / 1000) * 1000,
    };
    const cookies = {
        last_env: 'g2',
        _csrf: 'b349d712ab644c9e74480ba48f7243a00a5df0215f43153fe82ee398cd5902efa:2:{i:0;s:5:"_csrf";i:1;s:32:"nKc1b4pHlW1lgeQdxFX_a-wr5QL6yMtU";}'
        gr_user_id: '2fb5d441-b995-421e-b337-fee36877854a'
        __secdyid: '323b84fdfe0f8d98a71a950200ed97b5de8137ea1578d262021635583373'
        __tracker_user_id__: '245123166979a00-70e0009336-ac2e6961'
        PHPSESSID: 'bsd4ff1qs3h9e7vt3s6hv85m21'
        acw_tc: '2f624a4416355956422488154e2631080e9ed22688b90675b53886d25bdf86'
    };
    return axios.get({
        base: 'https://ztcwx.myscrm.cn',
        url: `/index.php`,
        headers: {
            'cookie': Object.keys(cookies).map(cookieName => {
                return `${cookieName}=${cookies[cookieName]}`;
            }).join(';'),
            'accept': 'application/json, text/plain, */*',
            'accept-Encoding': 'gzip, deflate, br',
            'accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
            'connection': 'keep-alive',
            'host': 'ztcwx.myscrm.cn',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest'
        },
    });
}

async function getRoom(config) {
    // R.question.question_content
    // question.options
    // e.question_option_id
    // e.question_option_content
    const randomRes = await request({
        path: 'choose-room/get-random-code',
        params: {
            activityVersion: 1,
        },
    });
    const randomData = randomRes.data.data;
    const question = randomData.question;
    if(question){
        const answers = await getQuestion(question);
        randomData.question_option_id = answers.answer;
    }
    const submitRes = await request({
        path: 'choose-room/submit-order',
        params: {
            chooseRoomId: config.chooseRoomId,
	        activityVersion: config.activityVersion,
	        randomCode: randomData.randomCode,
            question_option_id: randomData.question_option_id,
        },
    });
    const submitCode = submitRes.data.status;
    switch(submitCode){}
}

(async function(){
    const roomConfigs = [
        {
            chooseRoomId: '',
            activityVersion: '',
        },
    ];
    let isSuccess = false;
    let configIndex = 0;
    while(!isSuccess && roomConfigs[configIndex]){
        try{
            const getResult = await getRoom(roomConfigs[configIndex]);
            isSuccess = true;
        }catch(e){
            console.error(e);
        }
        configIndex++;
    }
})()