import mongoose, { Schema, type Document, type Model } from "mongoose";

export type TicketStatus = "open" | "closed";

export interface ITicket extends Document {
  userId: string;
  channelId: string;
  type: string;
  status: TicketStatus;
  createdAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    userId: { type: String, required: true },
    channelId: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, required: true, enum: ["open", "closed"], default: "open" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Ticket: Model<ITicket> =
  mongoose.models.Ticket ?? mongoose.model<ITicket>("Ticket", ticketSchema);
