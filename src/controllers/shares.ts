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
	
  let buys = await shareRepository.find({
    where: { type: "buy", qty: MoreThan(0) },
    order: { prc: "ASC" },
  });

  if (buys?.length === 0) {
    const newShare = shareRepository.create({ qty, prc, type: "sell" });
    await shareRepository.save(newShare);
    return res.status(201).json({ status: "success" });
  }

  const price = Number(prc);

  if (!!buys?.find((b) => b.prc >= price)) {
    const highestShare = buys[buys.length - 1];

    if (highestShare.qty < qty) {
      let remainder = qty - highestShare.qty;
      highestShare.qty = 0;
      await shareRepository.save(highestShare);

      while (remainder) {
        buys = await shareRepository.find({
          where: { type: "buy", qty: MoreThan(0) },
          order: { prc: "ASC" },
        });
        let greaterShare = buys.find((b) => b.prc >= price);
        if (greaterShare && remainder >= greaterShare.qty) {
          remainder = remainder - greaterShare.qty;
          greaterShare.qty = 0;
          await shareRepository.save(greaterShare);
        } else if (greaterShare && greaterShare.qty >= remainder) {
          greaterShare.qty -= remainder;
          remainder = 0;
          await shareRepository.save(greaterShare);
        } else {
          const newShare = shareRepository.create({
            qty: remainder,
            prc: price,
            type: "sell",
          });
          remainder = 0;
          await shareRepository.save(newShare);
        }
      }
    } else {
      highestShare.qty -= qty;
      await shareRepository.save(highestShare);
    }
  } else {
    const sellShare = await shareRepository.findOne({
      where: { type: "sell", prc: price },
    });

    if (sellShare) {
      sellShare.qty = sellShare.qty + parseInt(qty);
      await shareRepository.save(sellShare);
    } else {
      const newShare = shareRepository.create({ qty, prc, type: "sell" });
      await shareRepository.save(newShare);
    }
  }

  return res.status(200).json({ status: "success" });
};

const buy = async (req: Request, res: Response, next: NextFunction) => {
	const { qty, prc } = req.body;
	
  let sells = await shareRepository.find({
    where: { type: "sell", qty: MoreThan(0) },
    order: { prc: "ASC" },
  });

  if (sells?.length === 0) {
    const newShare = shareRepository.create({ qty, prc, type: "buy" });
    await shareRepository.save(newShare);
    return res.status(201).json({ status: "success" });
  }

  const price = Number(prc);

  if (!!sells?.find((b) => b.prc <= price)) {
    const lowestShare = sells[0];

    if (lowestShare.qty < qty) {
      let remainder = qty - lowestShare.qty;
      lowestShare.qty = 0;
      await shareRepository.save(lowestShare);

      while (remainder) {
        sells = await shareRepository.find({
          where: { type: "sell", qty: MoreThan(0) },
          order: { prc: "ASC" },
        });
        let lowerShare = sells.find((b) => b.prc <= price);
        if (lowerShare && remainder >= lowerShare.qty) {
          remainder = remainder - lowerShare.qty;
          lowerShare.qty = 0;
          await shareRepository.save(lowerShare);
        } else if (lowerShare && lowerShare.qty >= remainder) {
          lowerShare.qty -= remainder;
          remainder = 0;
          await shareRepository.save(lowerShare);
        } else {
          const newShare = shareRepository.create({
            qty: remainder,
            prc: price,
            type: "buy",
          });
          remainder = 0;
          await shareRepository.save(newShare);
        }
      }
    } else {
      lowestShare.qty -= qty;
      await shareRepository.save(lowestShare);
    }
  } else {
    const buyShare = await shareRepository.findOne({
      where: { type: "buy", prc: price },
    });

    if (buyShare) {
      buyShare.qty = buyShare.qty + parseInt(qty);
      await shareRepository.save(buyShare);
    } else {
      const newShare = shareRepository.create({ qty, prc, type: "buy" });
      await shareRepository.save(newShare);
    }
	}
	
  return res.status(200).json({ status: "success" });
};

const book = async (req: Request, res: Response, next: NextFunction) => {
  const buys = await getShares("buy", "DESC");
  const sells = await getShares("sell", "ASC");
  const data = { buys, sells };

  return response({ res, code: 200, data });
};

export default { sell, buy, book };