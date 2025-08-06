const Joi = require("joi");

exports.registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

exports.productCreateSchema = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  owneraddress: Joi.string().trim().min(2).max(200).required(),
  addedPhotos: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string(),
        Joi.object({
          public_id: Joi.string().allow(""),
          url: Joi.string().uri(),
        })
      )
    )
    .default([]),
  description: Joi.string().allow(""),
  perks: Joi.array().items(Joi.string()).default([]),
  catagory: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ),
  stock: Joi.number().min(0).default(0),
  price: Joi.number().min(0).required(),
  district: Joi.string().allow(""),
  artistdes: Joi.string().allow(""),
  history: Joi.string().allow(""),
});

exports.orderCreateSchema = Joi.object({
  product: Joi.string().optional(), // kept for legacy "buy now"
  home_address: Joi.string().trim().min(4).required(),
  contact_no: Joi.string().trim().min(6).required(),
  items: Joi.number().integer().min(1).optional(),
  price: Joi.number().min(0).optional(),
});
