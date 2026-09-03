import { Transaction } from "../models/transaction.model.js";
import { Agreement } from "../models/agreement.model.js";
import { Notification } from "../models/notification.model.js";
import { emitNotification } from "../socket.js";

// Check for upcoming returns and overdue items
export const checkReminders = async () => {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    try {
        // Find active transactions with agreements
        const activeTransactions = await Transaction.find({
            status: 'ACTIVE'
        }).populate({
            path: 'item',
            select: 'title mode'
        }).populate({
            path: 'requester',
            select: 'fullName'
        }).populate({
            path: 'owner',
            select: 'fullName'
        });

        for (const transaction of activeTransactions) {
            // Only check RENT mode items
            if (transaction.item?.mode !== 'RENT') continue;

            const agreement = await Agreement.findOne({ transaction: transaction._id });
            if (!agreement || !agreement.returnDate) continue;

            const returnDate = new Date(agreement.returnDate);
            const timeDiff = returnDate.getTime() - now.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            // 3 days before reminder
            if (daysDiff <= 3 && daysDiff > 1) {
                await createReminderNotification(
                    transaction.requester._id,
                    'REMINDER',
                    'Return Reminder',
                    `Your borrowed item "${transaction.item.title}" is due in ${daysDiff} days.`,
                    transaction._id
                );
            }

            // 1 day before reminder
            if (daysDiff === 1) {
                await createReminderNotification(
                    transaction.requester._id,
                    'REMINDER',
                    'Return Tomorrow',
                    `Your borrowed item "${transaction.item.title}" is due tomorrow!`,
                    transaction._id
                );
            }

            // Due today
            if (daysDiff === 0) {
                await createReminderNotification(
                    transaction.requester._id,
                    'REMINDER',
                    'Return Due Today',
                    `Your borrowed item "${transaction.item.title}" is due today. Please return it.`,
                    transaction._id
                );
                await createReminderNotification(
                    transaction.owner._id,
                    'REMINDER',
                    'Item Due Today',
                    `"${transaction.item.title}" borrowed by ${transaction.requester.fullName} is due today.`,
                    transaction._id
                );
            }

            // Overdue
            if (daysDiff < 0) {
                const overdueDays = Math.abs(daysDiff);
                await createReminderNotification(
                    transaction.requester._id,
                    'OVERDUE',
                    'Item Overdue',
                    `Your borrowed item "${transaction.item.title}" is ${overdueDays} day(s) overdue. Please return it immediately.`,
                    transaction._id
                );
                await createReminderNotification(
                    transaction.owner._id,
                    'OVERDUE',
                    'Item Overdue',
                    `"${transaction.item.title}" borrowed by ${transaction.requester.fullName} is ${overdueDays} day(s) overdue.`,
                    transaction._id
                );
            }
        }
    } catch (error) {
        console.error('Reminder check error:', error);
    }
};

const createReminderNotification = async (userId, type, title, message, transactionId) => {
    // Check if similar notification was already sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingNotification = await Notification.findOne({
        user: userId,
        type,
        relatedTransaction: transactionId,
        createdAt: { $gte: today }
    });

    if (existingNotification) return;

    const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        relatedTransaction: transactionId
    });

    // Emit real-time notification
    try {
        emitNotification(userId.toString(), notification);
    } catch (e) {
        // Socket may not be initialized
    }
};

// Start the reminder scheduler (runs every hour)
export const startReminderScheduler = () => {
    // Run immediately on startup
    checkReminders();
    
    // Then run every hour
    setInterval(checkReminders, 60 * 60 * 1000);
    console.log('Reminder scheduler started');
};
