const { Project, Vendor, Asset, User } = require('../models');

// Project Controllers
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.findAll({
            where: { organizationId: req.user.organizationId }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const project = await Project.create({
            ...req.body,
            organizationId: req.user.organizationId
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Vendor Controllers
exports.getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.findAll({
            where: { organizationId: req.user.organizationId }
        });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createVendor = async (req, res) => {
    try {
        const vendor = await Vendor.create({
            ...req.body,
            organizationId: req.user.organizationId
        });
        res.status(201).json(vendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Asset Controllers
exports.getAssets = async (req, res) => {
    try {
        const assets = await Asset.findAll({
            where: { organizationId: req.user.organizationId },
            include: [{ model: User, attributes: ['name', 'email'] }]
        });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAsset = async (req, res) => {
    try {
        const asset = await Asset.create({
            ...req.body,
            organizationId: req.user.organizationId
        });
        res.status(201).json(asset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
