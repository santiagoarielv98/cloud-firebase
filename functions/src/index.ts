import {logger} from "firebase-functions";
import functions = require("firebase-functions/v1");

import admin = require("firebase-admin");
admin.initializeApp();

export const onUserWritten = functions.firestore
  .document("users/{userId}")
  .onWrite((change, context) => {
    const userId = context.params.userId;
    const data = change.after.data();

    logger.info(`User id: ${userId}`);
    logger.info(`User data: ${JSON.stringify(data)}`);
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
