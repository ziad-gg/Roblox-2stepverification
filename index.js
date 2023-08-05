const { REST, Routes } = require("zoblox.js");
const { setTimeout: wait } = require("node:timers/promises")
const mail = require("./google.js");
const Cookie = require("./config.json")[0];

(async () => {

    await mail();

    const rest = new REST();
    await rest.setCookie(Cookie);

    let username = 'SR128916';
    let userId = '3438433765';

    let challengeId = null;
    let RblxChallengeMetadata = null;
    let RblxChallengeType = null;
    let challengeType = 7;

    const Ipayout = {
        recipientId: userId,
        recipientType: "User",
        amount: 1,
    };

    await payout(5210705, Ipayout).catch((error) => {
        challengeId = error.response.headers["rblx-challenge-id"];
    });


    while (challengeId) {
        let verificationCode = null;

        requestCode(userId, challengeId, challengeType).then(async () => {
            await ConfigurateCode(userId, challengeId, challengeType)


            await wait(10_000);

            const { message } = await mail();

            if (message.includes(username)) {
                const codeRegExp = /\b(\d{6})\b/;
                const match = message.match(codeRegExp);
                if (match && match[1]) {
                    verificationCode = match[1];
                    console.log('Found verification code:', verificationCode);
                } else {
                    console.log('Unable to extract the verification code from the message:', message);
                };



                if (verificationCode) {
                    await verifyCode(userId, challengeId, challengeType, verificationCode).then(console.log).catch((e) => {
                        console.log(e.response.data)
                    });
                }


            } else {
                console.log('Message does not contain the 2-Step Verification Code or does not include the username.');
            }

        }).catch((error) => {
            console.log(error.response.data)
            // process.kill(1);
        });

        break;
    }

    function payout(groupId, payout, challengeId) {
        return new Promise((res, rej) => {
            return rest.post(Routes.groups.payouts(groupId), {
                data: {
                    'Rblx-Challenge-Id': challengeId,
                    'Rblx-Challenge-Metadata': RblxChallengeMetadata,
                    'Rblx-Challenge-Type': 'twostepverification',
                    PayoutType: "FixedAmount",
                    Recipients: [payout]
                },
            })
                .then(res)
                .catch(rej)
        })
    };


    function ConfigurateCode(userId, challengeId, challengeType) {
        return new Promise((res, rej) => {
            return rest.get(`https://twostepverification.roblox.com/v1/users/${userId}/configuration?challengeId=${challengeId}&actionType=${challengeType}`)
                .then(res)
                .catch(rej)
        })
    }

    function requestCode(userId, challengeId, challengeType) {
        return new Promise((res, rej) => {
            return rest.get(`https://twostepverification.roblox.com/v1/metadata?userId=${userId}&challengeId=${challengeId}&actionType=${challengeType}`)
                .then(res)
                .catch(rej)
        })
    };

    function verifyCode(userId, challengeId, challengeType, code) {
        return new Promise((res, rej) => {
            return rest.post(`https://twostepverification.roblox.com/v1/users/${userId}/challenges/email/verify`, {
                data: {
                    challengeId,
                    code,
                    actionType: challengeType
                }
            })
                .then(res)
                .catch(rej)
        })
    }

})();