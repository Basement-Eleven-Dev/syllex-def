import {
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import createError from "http-errors";
import { sendEmail } from "../email/sendEmail";

const cognitoClient = new CognitoIdentityProviderClient({ region: "eu-south-1" });
const USER_POOL_ID = process.env.COGNITO_POOL_ID;

export const createCognitoUser = async (
  email: string,
  firstName: string,
  lastName: string,
  role: "admin" | "teacher" | "student"
) => {
  if (!USER_POOL_ID) throw new Error("COGNITO_POOL_ID not configured");

  const groupName =
    role === "teacher"
      ? "teachers"
      : role === "admin"
        ? "admins"
        : "students";
  
  const tempPassword =
    Math.random().toString(36).slice(-10) +
    "!" +
    Math.floor(Math.random() * 10);

  try {
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim(),
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: email.trim() },
        { Name: "email_verified", Value: "true" },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    });

    const result = await cognitoClient.send(createCommand);
    const cognitoSub = result.User?.Attributes?.find(
      (a) => a.Name === "sub"
    )?.Value;

    if (!cognitoSub) throw new Error("Sub not found in Cognito response");

    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email.trim(),
        Password: tempPassword,
        Permanent: false,
      })
    );

    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim(),
      GroupName: groupName,
    });
    await cognitoClient.send(addToGroupCommand);

    const roleLabel =
      role === "admin"
        ? "Amministratore"
        : role === "teacher"
          ? "Docente"
          : "Studente";
    
    await sendEmail(
      email.trim(),
      "Benvenuto su Syllex - Le tue credenziali",
      getWelcomeEmailHtml(firstName, email.trim(), tempPassword, roleLabel)
    );

    return cognitoSub;
  } catch (error: any) {
    if (error.name === "UsernameExistsException") {
      throw createError.Conflict(`User ${email} already exists`);
    }
    throw error;
  }
};

export const updateCognitoUser = async (
  email: string,
  firstName: string,
  lastName: string
) => {
  if (!USER_POOL_ID) throw new Error("COGNITO_POOL_ID not configured");

  try {
    const updateCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: email.trim(),
      UserAttributes: [
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    });

    await cognitoClient.send(updateCommand);
  } catch (error: any) {
    console.error("Error updating Cognito user:", error);
    throw error;
  }
};

export const getWelcomeEmailHtml = (
  firstName: string,
  email: string,
  password: string,
  role: string
) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 12px; color: #333; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #007bff; margin: 0; font-size: 28px;">Syllex</h2>
        <p style="color: #666; margin-top: 5px; font-size: 14px;">La tua piattaforma per la didattica</p>
      </div>
      
      <p style="font-size: 16px;">Ciao <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px;">Il tuo account come <strong>${role}</strong> è stato creato correttamente.</p>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
        <p style="margin: 0 0 15px 0; font-weight: bold; color: #495057;">Dettagli Account:</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Password Temporanea:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; color: #d63384;">${password}</code></p>
      </div>
      
      <p style="font-size: 14px; color: #666;">Al primo accesso ti verrà richiesto di cambiare questa password per la tua sicurezza.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://app.syllex.org" style="background-color: #007bff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Accedi ora</a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">Hai ricevuto questa email perché sei stato registrato su Syllex.<br>Se pensi si tratti di un errore, ignora questa comunicazione.</p>
    </div>
  `;
};
