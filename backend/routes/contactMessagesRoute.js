import { Router } from "express";
import ContactMessage from "../models/ContactMessage.js";

export const contactMessagesRouter = Router();

contactMessagesRouter.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const messages = await ContactMessage.find(query).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ error: "Failed to fetch contact messages" });
  }
});

contactMessagesRouter.post("/", async (req, res) => {
  try {
    const message = await ContactMessage.create(req.body);
    res.status(201).json(message);
  } catch (error) {
    console.error("Error creating contact message:", error);
    res.status(500).json({ error: "Failed to create contact message" });
  }
});

contactMessagesRouter.put("/:id", async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!message) {
      return res.status(404).json({ error: "Contact message not found" });
    }

    res.json(message);
  } catch (error) {
    console.error("Error updating contact message:", error);
    res.status(500).json({ error: "Failed to update contact message" });
  }
});
