// import { collection, getDoc, updateDoc, doc, setDoc } from "firebase/firestore";
// import { db } from "./firebaseConfig";

// let document;
// let docID;
// async function getData() {
//   const querySnapshot = await getDocs(collection(db, "users"));
//   querySnapshot.forEach((doc) => {
//     if (doc.id == testID) {
//       console.log(doc.id == testID);
//       document = doc;
//       docID = doc.id;

//       return;
//     }
//   });
//   console.log(document);
//   console.log(docID);
// }

// async function updateData() {
//   try {
//     let docref = doc(db, "users", testID, "courses", "mnm");
//     const data = await getDoc(docref);
//     console.log(data.data().paid);
//     await setDoc(docref, { paid: true });
//   } catch (error) {
//     console.log("Error updating document: ", error);
//   }
// }

// async function updateData() {
//   try {
//     await updateDoc(doc(db, "users", testID), {
//       first: "testtt",
//     });
//     console.log("Document updated successfully!"); // Log success message
//   } catch (error) {
//     console.log("Error updating document: ", error);
//   }
// }
