const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();

app.use(cors()); // Taki teri website se API call fail na ho

// TERI FIREBASE MASTER KEY (Jo tune di)
const serviceAccount = {
  "type": "service_account",
  "project_id": "verification-1d954",
  "private_key_id": "c7a48fcd0c5a77e4405620253e723d25e15c67e6",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQD0b3SK/MGoxy4z\n1poQXzB3OANEYiKvJTo8iRMdvZXxipwScYxrWCk5RzdlLR39EWuH/FWyln/Eo+zn\nQvKcYM8Ug8XnHL4hlNsu5GD7qbWseibJ7KnyfVh4YNrAatEPJITTvNAvzVxXD7Mt\nbwxIj1A4FRmh+sSjb+U/fR65A2YGF0PyUj5xoFkusWB58kxCZmro9zc91w/z98LZ\ntb1as51Ieaug51FXOnXT3anDDCHIsuwAlIK3F+uzS7yS3FNusgiAoQ0Ni52bWwlF\nmBMPTGdFRblDWwqTtyiABm7KLGs0ehpz9deWN9nzSLhlp7MdkFT9aYE968lXvpTx\nGBKQPnD9AgMBAAECggEAApZOAjn8vCVuWOhphVW9YyGk/TVAGNQr/d+7vVAx1SNK\nfBjjq6L8l4MOtDCXG7c/VcQT5yA+XKcy6g60ffdTWCwxE2PKCmJzZtdn3foIA3n5\ns6Age1tpLPSZFB/9TV76VFOWoE7lrlrRVdOFUOl9Z9HA8/MxLIN4bNfaINfg0LZe\nIW8oEc3GuLGUjt15VKTn9h2Pwpi6shfGhwbOr6LaXVzZVV0OCseYDIMqzYZo3sbt\ntg3S5JgwJcXXfrnqkkij58fc2GpgQi16URZeldHx8YPjx/XlWRinVAlmNaV9/tUk\n6Whs6zgXtqgtRpBU83MmdHXfFi/nkpl8hDYxIu3I6QKBgQD/A9Q4iANpBKHJTNOa\nGcVa1DZe32d4jVtQijW5g6A/xx7oYXips/QL4VXJhgpZaiGnK9GbMlHxyAQVufgD\nMkSlwtC2bDzqznhhX/W7dxlmG157h+pYGzjMpLKRAO9KU3bjYpL7deQmzWfuDcz/\n4FBcYeuC+IaEJVDExj66lJpwtQKBgQD1YSom/sMI1Ck4pISmoyTtO89gdSMbKpNJ\nSdvoJPhi8XO/5zZVeMheW0PCiBtEp+/+N6zyQGlc7zbfDHuJm1PLlZRRusiEWj3C\ny8lTQwue4O1snxYW1wv1e4JG/SWRGgSeoEE/M/msaajwc8ofsej2hKykzqcuYy3B\nqfgpO8tUKQKBgQDYpescn8it5oaAGunGCFDXCmSqkwc3rne+Y7yiv4VbyZGjgHNf\nUQdrNGOKUnrmXbj7acmoHMbrLq7xuk1Ogd06KdjgsfHK1eAFcd21BsioK2ZIcj6P\n3YiSqvUdJXslXOUq5mrSgOR0Zpr97fGUDICZC4NmgDbfe0gz8+wE3Qyb5QKBgQCq\nD/5z6ktn2gr7q+IXz6gvFy3Bz01WbaqIt7zGZqETif5L+UYJ9N0BsEUFFOm5Kp9F\nVHbzqrqbY1tnOTKBi3qG9ZNHFaoVOKnnUO+mWig6o+9JQfTAPaiXKVOAOcCIkTy0\nZ6Lw1+fpm40voUBruRUZjZhN3L+3gZtbxp4sjbl9CQKBgQC76Gob7VIPcWELUa1d\nAjozf2Bp4HuZlXS8ONz/sD1yA2ZnHKQDg3gHt3MaBZHUcsZK9UKU+0edHCpXVMh9\nDmdKZY4KyvQ3zLk2wGYFCLeNb2XRsMNPXJt8/x79tvIZlIPe/tF7ywN8Kns7r7MK\n2VHRZOytgoFtcpeWwI+wMtazcg==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@verification-1d954.iam.gserviceaccount.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://verification-1d954-default-rtdb.firebaseio.com"
});
const db = admin.database();

// API 1: Generate Link
app.get('/generate-link', async (req, res) => {
    const uid = req.query.uid;
    if (!uid) return res.status(400).json({ error: "UID missing" });

    const secretToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    
    // Status verifying set kar diya
    await db.ref('users/' + uid).set({ status: 'verifying', token: secretToken, time: Date.now() });

    const destinationUrl = encodeURIComponent(`https://verifyaps.edgeone.dev/?uid=${uid}`);
    
    // LinkPays API Call with your key. Token passed in subid alias
    const linkPaysAPI = `https://linkpays.in/api?api=db94310aa3bb96eee3df26dc672a9c19951ec8b6&url=${destinationUrl}&alias=${secretToken}`;
    
    try {
        const response = await fetch(linkPaysAPI);
        const data = await response.json(); 
        if(data.status === 'success') {
            res.json({ url: data.shortenedUrl });
        } else {
            res.status(500).json({ error: "Link shortener failed" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// API 2: Webhook
app.get('/webhook', async (req, res) => {
    // Note: Linkpays might send it via 'alias' or 'subid' query parameter based on postback
    const receivedToken = req.query.subid || req.query.alias; 
    
    if(!receivedToken) return res.status(400).send("No token");

    const snapshot = await db.ref('users').orderByChild('token').equalTo(receivedToken).once('value');
    
    if (snapshot.exists()) {
        const uid = Object.keys(snapshot.val())[0];
        // Verified on server side! Hacker failed!
        await db.ref('users/' + uid + '/status').set('verified');
        res.send("Webhook Success");
    } else {
        res.send("Invalid Token");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bhai Ka Server On Hai!`));
