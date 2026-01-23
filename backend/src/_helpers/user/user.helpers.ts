import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  AdminSetUserPasswordCommandInput,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Db, ObjectId } from "mongodb";
import { User } from "../../functions/profile/getMyProfile";

const COGNITO_POOL_ID = "eu-south-1_eH7c9zDXM";
const COGNITO_REGION = "eu-south-1";

export const createAndLinkUser = async (
  db: Db,
  userData: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: "admin" | "teacher" | "student";
    organizationIds: ObjectId[];
  }
): Promise<User> => {
  const { email, password, firstName, lastName, role, organizationIds } =
    userData;

  const cognitoClient = new CognitoIdentityProviderClient({
    region: COGNITO_REGION,
  });

  const createUserInput: AdminCreateUserCommandInput = {
    UserPoolId: COGNITO_POOL_ID,
    Username: email.trim(),
    MessageAction: "SUPPRESS",
    UserAttributes: [
      { Name: "email", Value: email.trim() },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: firstName },
      { Name: "family_name", Value: lastName },
    ],
  };

  if (password) {
    createUserInput.TemporaryPassword = password;
  }

  const createUserResult = await cognitoClient.send(
    new AdminCreateUserCommand(createUserInput)
  );

  const cognitoSub = createUserResult.User?.Attributes?.find(
    (attr) => attr.Name === "sub"
  )?.Value;

  if (!cognitoSub) {
    throw new Error("Creazione utente su Cognito fallita: sub non trovato.");
  }

  if (password) {
    const setPasswordInput: AdminSetUserPasswordCommandInput = {
      UserPoolId: COGNITO_POOL_ID,
      Username: email.trim(),
      Password: password.trim(),
      Permanent: true,
    };
    await cognitoClient.send(new AdminSetUserPasswordCommand(setPasswordInput));
  }

  const newUserDocument: any = {
    username: email.trim(),
    cognitoId: cognitoSub,
    firstName,
    lastName,
    role,
    organizationIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const usersCollection = db.collection("users");
  const result = await usersCollection.insertOne(newUserDocument);

  console.log(`✅ Utente ${email} creato con successo in MongoDB.`);
  return { ...newUserDocument, _id: result.insertedId };
};
