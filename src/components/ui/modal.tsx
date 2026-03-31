import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    maxWidthClass?: string;
    showHeader?: boolean;
    bodyClassName?: string;
    children: React.ReactNode;
}

const Modal = ({
    isOpen,
    onClose,
    title,
    maxWidthClass = "max-w-4xl",
    showHeader = true,
    bodyClassName = "p-6 max-h-[80vh] overflow-y-auto bg-white",
    children
}: ModalProps) => {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-foreground/30 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`relative w-full ${maxWidthClass} bg-card border border-border/50 rounded-2xl card-shadow-lg overflow-hidden`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {showHeader && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="flex items-center justify-between p-5 sm:p-6 border-b border-border/40 bg-card"
                            >
                                <h3 className="text-lg font-semibold text-foreground">
                                    {title || "Details"}
                                </h3>
                                <motion.button
                                    onClick={onClose}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-1.5 rounded-lg hover:bg-background transition-all duration-200 text-foreground/60 hover:text-foreground"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Body */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            className={bodyClassName}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
