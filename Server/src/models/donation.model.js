import mongoose, {Schema} from "mongoose";

const donationSchema = new Schema(
    {
        donorName: {
            type: String,
            required: true
        },
        donorEmail: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        paymentId: {
            type: String // from Razorpay or Stripe
        },
        message: {
            type: String
        },
    },{timestamps:true}
)

export const Donation = mongoose.model('Donation', donationSchema)