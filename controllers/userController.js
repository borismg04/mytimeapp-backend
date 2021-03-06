import modelUser from "../models/User.js";
import generateId from "../helpers/generateId.js";
import generateJWT from "../helpers/generateJWT.js";
import {emailRegistro , emailOlvidePassword} from '../helpers/email.js';

//Registro de Usuario
const handlerRegisterUser = async (req, res) => {
  // Evitar registro de usuarios duplicados
  const { email } = req.body;
  const userDuplicate = await modelUser.findOne({ email });

  if (userDuplicate) {
    const error = new Error("El usuario ya existe ⛔");
    return res.status(400).json({
      msg: error.message,
    });
  }

  try {
    const user = new modelUser(req.body);
    user.token = generateId();
    await user.save();

    //Enviar correo de confirmacion
    emailRegistro({
      email: user.email,
      nombre: user.nombre,
      token: user.token,
    });


    res.json({msg: "Usuario registrado correctamente✅,Revisa tu correo para confirmar tu cuenta📧"});
  } catch (error) {
    console.log(error);
    // res.status(500).json({ msg: "Error al registrar el usuario ⛔" });
  }
};

const handlerAuthenticateUser = async (req, res) => {
  const { email , password } = req.body;
  //Verificar si el usuario existe o no esta en la base de datos
  const user = await modelUser.findOne({ email });
    if (!user) {
      const error = new Error("El usuario no existe ⛔");
      return res.status(404).json({
        msg: error.message,
      });
    }
  //verificar si el usuario esta confirmado
    if (!user.confirmado) {
      const error = new Error("Tu cuenta no ha sido confirmada ⚠️");
      return res.status(403).json({
        msg: error.message,
      });
    }
    //Verificar si la contraseña es correcta
    if (await user.isValidPassword(password)) {
      res.json({
        msg: "Usuario autenticado correctamente ✅",
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        token: generateJWT(user._id),
      });
    }else{
      const error = new Error("Contraseña incorrecta ⛔");
      return res.status(403).json({
        msg: error.message,
      });
    }
  }

  const handlerConfirmUser = async (req, res) => {
    const { token } = req.params;
    const userConfirm = await modelUser.findOne({ token });
    if (!userConfirm) {
      const error = new Error("El token no existe ⛔");
      return res.status(403).json({
        msg: error.message,
      });
    }

    try {
      userConfirm.confirmado = true;
      userConfirm.token="";
      await userConfirm.save();
      res.json({
        msg: ` El usuario ${userConfirm.email} ha sido confirmado ✅`,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Error al confirmar el usuario ⛔" });
    }
  }

  const handlerForgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await modelUser.findOne({ email });
    if (!user) {
      const error = new Error(`El usuario con ${email} no existe ⛔`);
      return res.status(404).json({
        msg: error.message,
      });
    }

    try {
      user.token = generateId();
      await user.save();

      //Enviar correo de confirmacion
      emailOlvidePassword({
        email: user.email,
        nombre: user.nombre,
        token: user.token,
      });


      res.json({
        msg: `Se ha enviado un correo a ${email} para recuperar la contraseña 📧`,
      });
      console.log(user.email);
    } catch (error) {
      console.log(error);
    }
  }

  const handlerCheckToken = async (req, res) => {
    const { token } = req.params;
    const tokenValue = await modelUser.findOne({ token });
    if (tokenValue) {
      res.json({
        msg: `El token es valido y el Usuario existe ✅`,
      });
    } else {
      const error = new Error(`El token no es valido ⛔`);
      return res.status(404).json({
        msg: error.message,
      });
    }
  }

  const handlerChangePassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await modelUser.findOne({ token });
    if (user) {
      user.password = password;
      user.token = "";
      try {
        await user.save();
        res.json({
          msg: `La contraseña ha sido cambiada ✅`,
        });
      } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error al cambiar la contraseña ⛔" });
      }
    } else {
      const error = new Error(`El token no es valido ⛔`);
      return res.status(404).json({
        msg: error.msg,
      });
    }
  }

  const perfil = async (req, res) => {
    const {user}=req;
    res.json(user);
  }

export {
  handlerRegisterUser,
  handlerAuthenticateUser,
  handlerConfirmUser,
  handlerForgotPassword,
  handlerCheckToken,
  handlerChangePassword,
  perfil
}
