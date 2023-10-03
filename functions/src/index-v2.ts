import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {HttpsError, onCall, onRequest} from "firebase-functions/v2/https";
import {users} from "./data";

initializeApp();

//  utilizando la version 2 de firebase functions

export const onUserWrittenV2 = onDocumentWritten(
  "users/{userId}",
  async (event) => {
    if (!event.data) return;

    const userId = event.params.userId;

    logger.info(`User id: ${userId}`);
  }
);

export const getUsersV2 = onRequest(async (req, res) => {
  const snapshot = await getFirestore().collection("users").get();
  const users = snapshot.docs.map((doc) => doc.data());
  res.status(200).send(users);
});

export const updateUsersV2 = onRequest(async (req, res) => {
  const userId = req.params[0];
  const body = req.body;

  await getFirestore()
    .collection("users")
    .doc(userId)
    .update(body, {merge: true});

  res.status(200).send("OK");
});

export const validateUserV2 = onCall(async (req) => {
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

const main = async () => {
  const db = getFirestore();

  const collectionRef = db.collection("users");
  const snapshot = await collectionRef.count().get();

  if (snapshot.data().count === 0) {
    await Promise.all(
      users.map(async (data) => {
        const userRef = getFirestore().collection("users").doc();
        await userRef.set({
          ...data,
          id: userRef.id,
        });
      })
    );
  }
};
main();
