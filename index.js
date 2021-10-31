const axios = require('axios');
const getQuestion = require('./question');

const commonParams = {
    orgcode: 'zjdcgfadmin',
    token: 'yfltcu1628489680',
    activityId: 13526,
    chooseRoomId: '',
};

const mockMap = {
    'choose-room/get-random-code': '/random.json',
    'choose-room/submit-order': '/submit.json',
};

function request({
    path,
    params = {},
} = {}){
    // console.log('params:', params);
    const normalizedParams = {
        ...commonParams,
        r: path,
        t: parseInt(Date.now() / 1000) * 1000,
        ...params
    };
    const cookies2 = {
        last_env: 'g2',
        _csrf: 'b349d712ab644c9e74480ba48f7243a00a5df0215f43153fe82ee398cd5902efa:2:{i:0;s:5:"_csrf";i:1;s:32:"nKc1b4pHlW1lgeQdxFX_a-wr5QL6yMtU";}',
        gr_user_id: '2fb5d441-b995-421e-b337-fee36877854a',
        __secdyid: '323b84fdfe0f8d98a71a950200ed97b5de8137ea1578d262021635583373',
        __tracker_user_id__: '2451a40113c8860-1066004dee-cf206570',
        PHPSESSID: '3q8ia2t2ft27s6r8opkhbojmf5',
        acw_tc: '2f624a4416355956422488154e2631080e9ed22688b90675b53886d25bdf86',
        env_orgcode: '',
    };

    const cookies = {
        "last_env": "g2",
        "__tracker_user_id__": "2451a40113c8860-1066004dee-cf206570",
        "PHPSESSID": "3q8ia2t2ft27s6r8opkhbojmf5",
        "env_orgcode": "zjdcgfadmin",
        // "public_no_token": "888ce0a9acd12854102290e8371089edf7c47a27ba5d8f202d9cd47361afdc54a%3A2%3A%7Bi%3A0%3Bs%3A15%3A%22public_no_token%22%3Bi%3A1%3Bs%3A16%3A%22yfltcu1628489680%22%3B%7D",
        // "yunke_org_id": "263eedb166c26104e4a665d7428720b32b849c62cc949ac688006957084ca22fa%3A2%3A%7Bi%3A0%3Bs%3A12%3A%22yunke_org_id%22%3Bi%3A1%3Bs%3A36%3A%2239efa67b-bc13-455f-c6f4-a0f555af0818%22%3B%7D",
        "ztc_org_id": "c59fd97ea1c07d9d2f6d223b37f38904999eca16a6cd48531aa26f07ed224f89a%3A2%3A%7Bi%3A0%3Bs%3A10%3A%22ztc_org_id%22%3Bi%3A1%3Bi%3A1328%3B%7D",
        "__secdyid": "a312a850d075d5b11f1f0b82e37d3ecfd20c9d594c639164021635658228",
        "acw_tc": "707c9fdb16356582286866329e2f0c1fcfb7e87ec0982b10fee10db539909d"
    };
    return axios({
        method: 'get',
        baseURL: 'https://ztcwx.myscrm.cn',
        // base: 'http://127.0.0.1:8887/',
        url: '/index.php',
        params: normalizedParams,
        // url: `http://127.0.0.1:8887${mockMap[path]}`,
        // url: `http://127.0.0.1:8887/random.json`,
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
            'X-Requested-With': 'XMLHttpRequest',
        },
    });
}

async function submitRoom(submitData, retryCount = 1){
    console.log('retryCount:', retryCount);
    if(retryCount > 100){ throw new Error(`retry max ${submitData.chooseRoomId} fail`)}
    const submitRes = await request({
        path: 'choose-room/submit-order',
        params: submitData,
    });
    const submitCode = submitRes.data && submitRes.data.data && submitRes.data.data.status;
    const errCode = {
        2: '资格失效',
        4: '您已有选中',
        5: '活动暂未开始，敬请期待',
        6: '网络异常，请稍后再试',
        7: '答案错误，请重新选择',
    };
    console.log('submitCode:', submitCode);
    const isSuccess = submitCode === 1;
    const res = {
        success: isSuccess,
        retryable: submitCode === 5,
    };
    if(isSuccess) {
        console.log(`success ${submitCode} ${submitData.chooseRoomId}`);
        return;
    } else if(res.retryable){
        console.log(`${submitData.chooseRoomId} retry`);
        return await submitRoom(submitData, retryCount+1);
    }
    throw new Error(`${submitData.chooseRoomId} fail`);
}

async function getRoom(config) {
    // R.question.question_content
    // question.options
    // e.question_option_id
    // e.question_option_content
    const randomRes = await request({
        path: 'choose-room/get-random-code',
        params: {
            activityVersion: config.activityVersion || 20,
            // orgcode: 'zjdcgfadmin',
            // token: 'yfltcu1628489680',
            // activityId: 13526,
            chooseRoomId: config.chooseRoomId,
        },
    });
    const retCode = randomRes.data.retCode;
    if(retCode != 0){
        throw new Error(`获取random失败`);
    }
    const randomData = randomRes.data.data;
    const question = randomData.question;
    randomData.question_option_id = 0;
    if(question){
        const answers = await getQuestion(question);
        randomData.question_option_id = answers.answer;
    }
    const params = {
        chooseRoomId: config.chooseRoomId,
        activityVersion: config.activityVersion || 20,
        randomCode: randomData.randomCode,
        question_option_id: randomData.question_option_id,
    };
    return await submitRoom(params);
}

function getRemindSeconds(){
    const now = new Date().getTime() / 1000;
    // 8点
    const targetTime = 1635681600;
    // 六点半
    // const targetTime = 1635676400;
    const remindSeconds = targetTime - now;
    return remindSeconds;
}

async function main(){
    const roomConfigs = [
        {
            // 1901
            chooseRoomId: 9284307,
            activityVersion: 23,
        }, {
            // 2001
            chooseRoomId: 9284294,
            activityVersion: 23,
        },
    ];
    let isSuccess = false;
    let configIndex = 0;
    while(!isSuccess && roomConfigs[configIndex]){
        try{
            const roomConfig = roomConfigs[configIndex];
            const getResult = await getRoom(roomConfig);
            console.log('done', roomConfig);
            isSuccess = true;
        }catch(e){
            console.error(e);
        }
        configIndex++;
    }
}

function clock(){
    const remindSeconds = getRemindSeconds();
    console.log('remindSeconds:', remindSeconds);
    if(remindSeconds > 1){
        setTimeout(clock, remindSeconds / 2 * 1000);
        console.log('next test after', remindSeconds / 2, '秒');
        return;
    }
    while(getRemindSeconds() <= 1) {
        main();
        break;
    }
}

clock();

// main();

// (async () => {
//     const res = await request({
//         path: 'choose-room/room',
//         params: {
//                 // activityVersion: config.activityVersion || 20,
//                 // orgcode: 'zjdcgfadmin',
//                 // token: 'yfltcu1628489680',
//                 // activityId: 13526,
//                 chooseRoomId: 9284307,
//             },
//     });
//     console.log('res:', res);
// })()
