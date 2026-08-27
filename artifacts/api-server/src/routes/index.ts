import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import assetsRouter from "./assets";
import checkoutRouter from "./checkout";
import shippingRouter from "./shipping";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import adminRouter from "./admin";
import adminAuthRouter from "./adminAuth";
import customerAuthRouter from "./customerAuth";
import meRouter from "./me";
import discountsRouter from "./discounts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(assetsRouter);
router.use(checkoutRouter);
router.use(shippingRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(customerAuthRouter);
router.use(meRouter);
router.use(discountsRouter);
router.use(adminAuthRouter);
router.use(adminRouter);

export default router;
