import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import checkoutRouter from "./checkout";
import shippingRouter from "./shipping";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(checkoutRouter);
router.use(shippingRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(adminRouter);

export default router;
