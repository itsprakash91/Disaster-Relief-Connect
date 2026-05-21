import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"]
        },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            unique: true
        },
        password: {
            type: String,
            required: [true, "Please enter a password"],
            minlength: 6,
            select: false
        },
        role: {
            type: String,
            enum: ["victim", "volunteer", "admin"],
            default: "victim"
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0]
            }
        },
        avatar: {
            type: String, // URL or base64 string
            default: ""
        },
        phone: {
            type: String,
            default: ""
        },
        address: {
            type: String,
            default: ""
        },
        refreshToken: {
            type: String,
            default: ""
        },
    },{timestamps:true}
)

// pre-save hook for Password hashing
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")){
        return next();
    }

    this.password = await bcrypt.hash(this.password,10);
    next()
})

// Method to compare passwords
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return  jwt.sign(
        {
            _id:this._id,
            email: this.email,
            name: this.name,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return  jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model('User',userSchema)
