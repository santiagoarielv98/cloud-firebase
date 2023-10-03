import {logger} from "firebase-functions";
import functions = require("firebase-functions/v1");

import admin = require("firebase-admin");
import {users} from "./data";
admin.initializeApp();

export const onUserWritten = functions.firestore
  .document("users/{userId}")
  .onWrite((change, context) => {
    const userId = context.params.userId;
    const data = change.after.data();

    logger.info(`User id: ${userId}`);
    logger.info(`User data: ${JSON.stringify(data)}`);
  });

export const getUsers = functions.https.onRequest(async (req, res) => {
  const snapshot = await admin.firestore().collection("users").get();
  const users = snapshot.docs.map((doc) => doc.data());
  res.status(200).send(users);
});

export const updateUsers = functions.https.onRequest(async (req, res) => {
  const userId = req.params[0];
  const body = req.body;

  await admin.firestore().collection("users").doc(userId).update(body);

  res.status(200).send("OK");
});

export const validateUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    logger.info("Se requiere autenticación");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Se requiere autenticación"
    );
  }

  const userId = context.auth.uid;
  const user = await admin.firestore().collection("users").doc(userId).get();

  if (!user.exists) {
    logger.info("El usuario no existe");
    throw new functions.https.HttpsError("not-found", "El usuario no existe");
  }

  return user.data();
});

const main = async () => {
  const db = admin.firestore();

  const collectionRef = await db.collection("users").get();
  const size = await collectionRef.size;

  if (size === 0) {
    await Promise.all(
      users.map(async (data) => {
        const userRef = admin.firestore().collection("users").doc();
        await userRef.set({
          ...data,
          id: userRef.id,
        });
      })
    );
  }
};
main();
