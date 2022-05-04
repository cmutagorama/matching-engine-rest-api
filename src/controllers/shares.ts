import { NextFunction, Request, Response } from "express";
import { MoreThan } from "typeorm";
import { AppDataSource } from "../data-source";
import { Share } from "../entities/Share";
import { response } from "../utils/response";

const shareRepository = AppDataSource.getRepository(Share);

const getShares = async (type, order) => {
  return shareRepository.find({
    where: { type, qty: MoreThan(0) },
    select: ["qty", "prc"],
    order: { prc: order },
  });
};

const sell = async (req: Request, res: Response, next: NextFunction) => {
  const { qty, prc } = req.body;
  const share = await shareRepository.findOne({
    where: { type: "buy", prc },
  });

  if (share) {
    const highestShare = await shareRepository.findOne({
      where: { type: "buy" },
      order: { prc: "DESC" },
    });
    if (qty > share.qty) {
      const sellShare = await shareRepository.findOne({
        where: { type: "sell", prc },
      });

      const remainder = qty - share.qty;
      share.qty = 0;
      await shareRepository.save(share);
      if (sellShare) {
        sellShare.qty += remainder;
        await shareRepository.save(sellShare);
      } else {
        const newShare = shareRepository.create({
          qty: remainder,
          prc,
          type: "sell",
        });
        await shareRepository.save(newShare);
      }
      return response({ res, code: 201, data: { share } });
    } else {
      let remainder = 0;
      if (highestShare.qty < qty) {
        remainder = qty - highestShare.qty;
        highestShare.qty = 0;
        share.qty -= remainder;
      } else {
        highestShare.qty -= qty;
      }
      await shareRepository.save(share);
      const savedShare = await shareRepository.save(highestShare);
      return response({ res, code: 200, data: { share: savedShare } });
    }
  }

  const sellShare = await shareRepository.findOne({
    where: { type: "sell", prc },
  });

  if (sellShare) {
    sellShare.qty = sellShare.qty + parseInt(qty);
    await shareRepository.save(sellShare);
    return response({ res, code: 200, data: { share: sellShare } });
  }

  const newShare = shareRepository.create({ qty, prc, type: "sell" });
  const savedShare = await shareRepository.save(newShare);
  return response({ res, code: 201, data: { share: savedShare } });
};

const buy = async (req: Request, res: Response, next: NextFunction) => {
  const { qty, prc } = req.body;
  const share = await shareRepository.findOne({
    where: { type: "sell", prc },
  });

  if (share) {
    const lowestShare = await shareRepository.findOne({
      where: { type: "sell" },
      order: { prc: "ASC" },
    });
    if (qty > share.qty) {
      const buyShare = await shareRepository.findOne({
        where: { type: "buy", prc },
      });

      const remainder = qty - share.qty;
      share.qty = 0;
      await shareRepository.save(share);
      if (buyShare) {
        buyShare.qty += remainder;
        await shareRepository.save(buyShare);
      } else {
        const newShare = shareRepository.create({
          qty: remainder,
          prc,
          type: "buy",
        });
        await shareRepository.save(newShare);
      }
      return response({ res, code: 201, data: { share } });
    } else {
      let remainder = 0;
      if (lowestShare.qty < qty) {
        remainder = qty - lowestShare.qty;
        lowestShare.qty = 0;
        share.qty -= remainder;
      } else {
        lowestShare.qty -= qty;
      }

      await shareRepository.save(share);
      const savedShare = await shareRepository.save(lowestShare);
      return response({ res, code: 200, data: { share: savedShare } });
    }
  }

  const buyShare = await shareRepository.findOne({
    where: { type: "buy", prc },
  });

  if (buyShare) {
    buyShare.qty = buyShare.qty + parseInt(qty);
    await shareRepository.save(buyShare);
    return response({ res, code: 200, data: { share: buyShare } });
  }

  const newShare = shareRepository.create({ qty, prc, type: "buy" });
  const savedShare = await shareRepository.save(newShare);
  return response({ res, code: 201, data: { share: savedShare } });
};

const book = async (req: Request, res: Response, next: NextFunction) => {
  const buys = await getShares("buy", "DESC");
  const sells = await getShares("sell", "ASC");
  const data = { buys, sells };

  return response({ res, code: 200, data });
};

export default { sell, buy, book };