import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {HttpsError, onCall, onRequest} from "firebase-functions/v2/https";

initializeApp();

//  utilizando la version 2 de firebase functions

export const onUserWritten = onDocumentWritten(
  "users/{userId}",
  async (event) => {
    if (!event.data) return;

    const userId = event.params.userId;

    logger.info(`User id: ${userId}`);
  }
);

export const updateUsers = onRequest(async (req, res) => {
  const userId = req.params[0];
  const body = req.body;

  await getFirestore()
    .collection("users")
    .doc(userId)
    .update(body, {merge: true});

  res.status(200).send("OK");
});

export const validateUser = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("unauthenticated", "Se requiere autenticación");
  }

  const uid = req.auth.uid;

  const user = await getFirestore().collection("users").doc(uid).get();

  if (!user.exists) {
    throw new HttpsError("not-found", "El usuario no existe");
  }

  return user.data();
});
